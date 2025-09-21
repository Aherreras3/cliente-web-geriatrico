import dynamic from "next/dynamic";

const AuthSlider = dynamic(() => import("./login/AuthSlider"), { ssr: false });

export default function Home() {
  return <AuthSlider />;
}
