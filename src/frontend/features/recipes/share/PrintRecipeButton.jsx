import React, { useState } from "react";
import { Printer } from "lucide-react";
import { useToast } from "@/app/ToastProvider";
import Button from "@/shared/ui/Button";

const PrintRecipeButton = ({ className }) => {
	const [status, setStatus] = useState("");
	const { showToast } = useToast();

	const handlePrint = () => {
		window.print();
		setStatus("Print dialog opened.");
		showToast({ title: "Print dialog opened" });
	};

	return (
		<>
			<Button type="button" size="lg" variant="outline" className={className} onClick={handlePrint} aria-label="Print recipe">
				<Printer className="size-4" aria-hidden="true" />
				Print
			</Button>
			<p className="sr-only" role="status" aria-live="polite">{status}</p>
		</>
	);
};

export default PrintRecipeButton;
