import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommentVoteValidator } from "@/lib/validators/vote";
import { z } from "zod";

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { commentId, voteType } = CommentVoteValidator.parse(body);

    const existingVote = await db.commentVote.findFirst({
      where: {
        userId: session.user.id,
        commentId,
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        await db.commentVote.delete({
          where: {
            userId_commentId: {
              commentId,
              userId: session.user.id,
            },
          },
        });
        return new Response("OK");
      } else {
        // Vote type is different
        await db.commentVote.update({
          where: {
            userId_commentId: {
              commentId,
              userId: session.user.id,
            },
          },
          data: {
            type: voteType,
          },
        });

        return new Response('OK')
      }
    }

    // No existing vote, create new one
    await db.commentVote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        commentId,
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
      "Could not register your vote. Please try again later",
      { status: 500 }
    );
  }
}
