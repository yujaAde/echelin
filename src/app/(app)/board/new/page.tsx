import { NewPostPage } from "@/components/posts/NewPostPage";

export const metadata = { title: "글쓰기 | E슐랭" };

export default function Page() {
  return <NewPostPage board="free" />;
}
