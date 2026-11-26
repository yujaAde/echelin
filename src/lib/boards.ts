// 게시판 종류. 후기('review')와 자유글('free')은 posts 테이블을 공유하고 board 열로 구분한다.
// 후기는 모임에서 다녀온 글(meeting_month 있음)과 개인 맛집 후기(meeting_month 없음)를 모두 담는다.

export type Board = "review" | "free";

export type BoardConfig = {
  path: string; // 목록 경로
  title: string; // 목록 제목, 메뉴 이름
  writeLabel: string; // 글쓰기 버튼·페이지 제목
  editTitle: string;
  submitLabel: string;
  emptyText: string;
  deleteConfirm: string;
};

export const BOARDS: Record<Board, BoardConfig> = {
  review: {
    path: "/posts",
    title: "맛집 후기",
    writeLabel: "후기 쓰기",
    editTitle: "후기 수정",
    submitLabel: "후기 올리기",
    emptyText: "아직 후기가 없습니다. 첫 후기를 남겨 보세요.",
    deleteConfirm: "이 후기와 사진, 댓글을 모두 삭제할까요?",
  },
  free: {
    path: "/board",
    title: "자유게시판",
    writeLabel: "글쓰기",
    editTitle: "글 수정",
    submitLabel: "글 올리기",
    emptyText: "아직 글이 없습니다. 첫 글을 남겨 보세요.",
    deleteConfirm: "이 글과 사진, 댓글을 모두 삭제할까요?",
  },
};

export function isBoard(value: unknown): value is Board {
  return value === "review" || value === "free";
}

export function postPath(board: Board, id?: string): string {
  const base = BOARDS[board].path;
  return id ? `${base}/${id}` : base;
}

// 후기 목록 보기 방식: 전체 또는 모임 후기만
export type ReviewView = "all" | "meeting";

export function isReviewView(value: unknown): value is ReviewView {
  return value === "all" || value === "meeting";
}
