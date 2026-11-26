import { PostListPage } from "@/components/posts/PostListPage";

export const metadata = { title: "자유게시판 | E슐랭" };

export default function BoardPage() {
  return <PostListPage board="free" />;
}
