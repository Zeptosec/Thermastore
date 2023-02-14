import StrechableText from "@/components/StrechableText";
import Link from "next/link";

export default function testPage() {

    return (
        <div className="pt-[72px]">
            <div className="gap-2 items-center">
                <Link href={"/"}>
                    <StrechableText text="asfskughashfguahfhafashuahuisagasfafafFFAfahfuiahf.txt" />
                </Link>
            </div>
        </div>
    )
}