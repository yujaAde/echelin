import { PostListPage } from "@/components/posts/PostListPage";

export const metadata = { title: "모임 후기 | E슐랭" };

export default function PostsPage() {
  return <PostListPage board="review" />;
}
