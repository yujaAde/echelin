import { PostListPage } from "@/components/posts/PostListPage";

export const metadata = { title: "맛집 후기 | E슐랭" };

export default function PostsPage(props: PageProps<"/posts">) {
  return <PostListPage board="review" searchParams={props.searchParams} />;
}
