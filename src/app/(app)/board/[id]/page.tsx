import { PostDetailPage } from "@/components/posts/PostDetailPage";

export default function Page(props: PageProps<"/board/[id]">) {
  return <PostDetailPage board="free" params={props.params} />;
}
