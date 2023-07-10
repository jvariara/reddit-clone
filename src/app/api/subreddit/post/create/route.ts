import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostValidator } from "@/lib/validators/post";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const { subredditId, title, content } = PostValidator.parse(body);

    // Find out if subscription exists
    const subscriptionExists = await db.subscription.findFirst({
      where: {
        subredditId: subredditId,
        userId: session.user.id,
      },
    });

    if (!subscriptionExists)
      return new Response("Subscribe to the subreddit to post.", {
        status: 400,
      });

    // Create post
    await db.post.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        subredditId,
      },
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Wrong data was passed into route
      return new Response("Invalid request data passed", { status: 422 });
    }

    // No idea what error was
    return new Response(
      "Could not post to subreddit at this time. Please try again later.",
      {
        status: 500,
      }
    );
  }
}
