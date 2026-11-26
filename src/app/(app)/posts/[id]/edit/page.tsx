import { EditPostPage } from "@/components/posts/EditPostPage";

export const metadata = { title: "후기 수정 | E슐랭" };

export default function Page(props: PageProps<"/posts/[id]/edit">) {
  return <EditPostPage board="review" params={props.params} />;
}
