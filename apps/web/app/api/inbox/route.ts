import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { approvals, captures, proposals } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { errorResponse, okResponse } from "@/lib/http/response";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);

    const [captureRows, proposalRows, approvalRows] = await Promise.all([
      db
        .select()
        .from(captures)
        .where(eq(captures.userId, userId))
        .orderBy(desc(captures.createdAt))
        .limit(100),
      db
        .select()
        .from(proposals)
        .where(eq(proposals.userId, userId))
        .orderBy(desc(proposals.createdAt)),
      db
        .select()
        .from(approvals)
        .where(eq(approvals.userId, userId))
        .orderBy(desc(approvals.createdAt))
    ]);

    const latestProposalByCapture = new Map<string, (typeof proposalRows)[number]>();
    for (const proposal of proposalRows) {
      if (!latestProposalByCapture.has(proposal.captureId)) {
        latestProposalByCapture.set(proposal.captureId, proposal);
      }
    }

    const approvalByProposal = new Map<string, (typeof approvalRows)[number]>();
    for (const approval of approvalRows) {
      if (!approvalByProposal.has(approval.proposalId)) {
        approvalByProposal.set(approval.proposalId, approval);
      }
    }

    const items = captureRows.map((capture) => {
      const proposal = latestProposalByCapture.get(capture.id) ?? null;
      const approval = proposal ? approvalByProposal.get(proposal.id) ?? null : null;

      return {
        capture: {
          id: capture.id,
          url: capture.url,
          title: capture.title,
          selectedText: capture.selectedText,
          snippet: capture.snippetNullable,
          createdAt: capture.createdAt.toISOString()
        },
        proposal:
          proposal && {
            id: proposal.id,
            parsedTitle: proposal.parsedTitle,
            startAt: proposal.startAt.toISOString(),
            endAt: proposal.endAt.toISOString(),
            location: proposal.locationNullable,
            notes: proposal.notesNullable,
            status: proposal.status,
            failureReason: proposal.failureReason,
            timezone: proposal.timezone,
            createdAt: proposal.createdAt.toISOString()
          },
        approval:
          approval && {
            id: approval.id,
            approvedAt: approval.approvedAt.toISOString(),
            gcalEventId: approval.gcalEventIdNullable,
            notionPageId: approval.notionPageIdNullable,
            notionStatus: approval.notionStatus,
            notionError: approval.notionError
          }
      };
    });

    return okResponse({ items });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to load inbox",
      401
    );
  }
}
