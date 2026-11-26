import { PostDetailPage } from "@/components/posts/PostDetailPage";

export default function Page(props: PageProps<"/posts/[id]">) {
  return <PostDetailPage board="review" params={props.params} />;
}
