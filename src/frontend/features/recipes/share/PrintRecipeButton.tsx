import React, { useState, type HTMLAttributes } from "react";
import { Printer } from "lucide-react";
import { useToast } from "@/app/ToastProvider";
import Button from "@/shared/ui/Button";

type PrintRecipeButtonProps = Pick<HTMLAttributes<HTMLButtonElement>, "className">;

const PrintRecipeButton = ({ className }: PrintRecipeButtonProps): React.ReactElement => {
	const [status, setStatus] = useState("");
	const { showToast } = useToast();

	const handlePrint = () => {
		window.print();
		setStatus("Print dialog opened.");
		showToast({ title: "Print dialog opened" });
	};

	return (
		<>
			<Button type="button" size="icon" variant="outline" className={`size-11 h-11 ${className || ""}`} style={{ fontSize: 0 }} onClick={handlePrint} aria-label="Print recipe" title="Print recipe">
				<Printer className="size-4" aria-hidden="true" />
				Print
			</Button>
			<p className="sr-only" role="status" aria-live="polite">{status}</p>
		</>
	);
};

export default PrintRecipeButton;
