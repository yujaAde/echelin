import { NewPostPage } from "@/components/posts/NewPostPage";

export const metadata = { title: "후기 쓰기 | E슐랭" };

export default function Page() {
  return <NewPostPage board="review" />;
}
