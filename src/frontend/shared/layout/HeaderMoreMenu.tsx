import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import {
	isNavigationItemActive,
	type NavigationGroup,
} from "./navigation";

export type HeaderMoreMenuProps = {
	groups: NavigationGroup[];
};

const HeaderMoreMenu = ({ groups }: HeaderMoreMenuProps): ReactElement | null => {
	const [open, setOpen] = useState(false);
	const { pathname } = useLocation();
	const menuRef = useRef<HTMLDivElement | null>(null);
	const toggleRef = useRef<HTMLButtonElement | null>(null);
	const items = groups.flatMap((group) => group.items);

	const closeMenu = useCallback((): void => {
		setOpen(false);
		toggleRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!open || typeof document === "undefined") return undefined;

		const handlePointerDown = (event: PointerEvent): void => {
			if (!(event.target instanceof Node)) return;
			if (!menuRef.current?.contains(event.target)) closeMenu();
		};
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				event.preventDefault();
				closeMenu();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeMenu, open]);

	if (groups.length === 0) return null;

	return (
		<div ref={menuRef} className="relative shrink-0">
			<button
				type="button"
				ref={toggleRef}
				className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="More navigation"
				aria-expanded={open}
				aria-haspopup="menu"
				onClick={() => setOpen((value) => !value)}
			>
				More
				<ChevronDown className="size-4" aria-hidden="true" />
			</button>

			{open && (
				<div
					className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl"
					role="menu"
					aria-label="More navigation links"
				>
					{groups.map((group) => (
						<section
							key={group.label}
							className="not-first:border-t not-first:border-border not-first:pt-2"
							role="group"
							aria-label={group.label}
						>
							<h2 className="px-3 pb-1 pt-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
								{group.label}
							</h2>
							<ul className="grid gap-0.5">
								{group.items.map((item) => {
									const active = isNavigationItemActive(
										pathname,
										item.href,
										items,
									);
									return (
										<li key={item.href}>
											<Link
												className={cn(
													"flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
													active && "bg-muted text-foreground",
												)}
												aria-current={active ? "page" : undefined}
												role="menuitem"
												to={item.href}
												onClick={() => setOpen(false)}
											>
												{item.title}
												<ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
											</Link>
										</li>
									);
								})}
							</ul>
						</section>
					))}
				</div>
			)}
		</div>
	);
};

export default HeaderMoreMenu;
