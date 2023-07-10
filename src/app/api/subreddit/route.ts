import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubredditValidator } from "@/lib/validators/subreddit";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    // 1) Check if user is logged in
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get body content
    const body = await req.json();
    // This body can be "anything", so make sure the correct data is passed with validator
    const { name } = SubredditValidator.parse(body);
    // If the 'correct' data is passed, a name will be there. If not, an error is thrown

    // If subreddit name exists, we cant create a new community
    const subredditExists = await db.subreddit.findFirst({
      where: {
        name,
      },
    });
    if (subredditExists)
      return new Response("Subreddit already exists", { status: 409 });

    // Now create the subreddit, with the name and creator id of the user that creates it
    const subreddit = await db.subreddit.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    });

    // If you create a subreddit, subscribe the user to that subreddit
    await db.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: subreddit.id,
      },
    });

    return new Response(subreddit.name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Wrong data was passed into route
      return new Response(error.message, { status: 422 });
    }

    // No idea what error was
    return new Response("Could not create subreddit", { status: 500 });
  }
}
