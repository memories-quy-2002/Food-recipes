import {
	useContext,
	useEffect,
	useRef,
	type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { authActions } from "@/features/auth/state/authSlice";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import { cn } from "@/shared/lib/utils";
import {
	isNavigationItemActive,
	type NavigationGroup,
	type NavigationItem,
} from "./navigation";
import Button from "@/shared/ui/Button";
import type { AppDispatch } from "@/app/store";
import type { AuthState, AuthUser } from "./HeaderAuthButton";

type AuthSnapshot = {
	isAuthenticated: boolean;
	user: AuthUser | null;
};

type AuthRef = {
	current: AuthSnapshot;
};

const isAuthRef = (value: unknown): value is AuthRef => {
	if (typeof value !== "object" || value === null || !("current" in value)) {
		return false;
	}
	const current = value.current;
	return (
		typeof current === "object" &&
		current !== null &&
		"isAuthenticated" in current &&
		typeof current.isAuthenticated === "boolean"
	);
};

const getAuthSnapshot = (value: object): AuthSnapshot => {
	if ("auth" in value && isAuthRef(value.auth)) return value.auth.current;
	return { isAuthenticated: false, user: null };
};

export type HeaderToggleProps = {
	show: boolean;
	handleClose: () => void;
	handleShow: () => void;
	items: NavigationItem[];
	moreGroups?: NavigationGroup[];
	action?: NavigationItem;
	auth?: AuthState;
};

const HeaderToggle = ({
	show,
	handleClose,
	handleShow,
	items,
	moreGroups = [],
	action,
}: HeaderToggleProps): ReactElement => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const authContext = useContext(AuthContext);
	const { isAuthenticated } = getAuthSnapshot(authContext);
	const drawerRef = useRef<HTMLElement | null>(null);
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);
	const restoreFocusRef = useRef<HTMLElement | null>(null);
	const { showToast } = useToast();

	useEffect(() => {
		if (!show || typeof document === "undefined") return undefined;
		restoreFocusRef.current =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const selector =
			'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				event.preventDefault();
				handleClose();
				return;
			}
			if (event.key !== "Tab") return;
			const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(selector);
			if (!focusable?.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		const frameId = window.requestAnimationFrame(() =>
			closeButtonRef.current?.focus(),
		);
		return () => {
			window.cancelAnimationFrame(frameId);
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = previousOverflow;
			if (restoreFocusRef.current) restoreFocusRef.current.focus();
		};
	}, [handleClose, show]);

	const handleNavigate = (href: string): void => {
		navigate(href);
		handleClose();
	};

	const handleSignOut = async (): Promise<void> => {
		try {
			await authSessionApi.logout();
		} catch {
			// Local auth must still clear when the server is unavailable.
		} finally {
			dispatch(authActions.logout());
			showToast({ title: "Signed out" });
			handleNavigate("/");
		}
	};

	const itemClass = (active = false): string =>
		cn(
			"flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			active && "bg-muted",
		);
	const mobileNavigation = show ? (
		<div className="fixed inset-0 z-[100]" role="presentation">
			<button
				type="button"
				aria-label="Close navigation menu"
				tabIndex={-1}
				className="absolute inset-0 bg-black/40"
				onClick={handleClose}
			/>
			<aside
				id="mobile-navigation"
				ref={drawerRef}
				className="fixed inset-y-0 right-0 w-[min(22rem,90vw)] overflow-y-auto bg-card p-5 shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="mobile-navigation-title"
			>
				<div className="flex items-start justify-between gap-4 border-b border-border pb-5">
					<div>
						<h2 id="mobile-navigation-title" className="text-xl font-black">
							Menu
						</h2>
					</div>
					<Button
						ref={closeButtonRef}
						variant="ghost"
						size="icon"
						aria-label="Close navigation menu"
						onClick={handleClose}
					>
						<X className="size-5" aria-hidden="true" />
					</Button>
				</div>
				<nav className="mt-4" aria-label="Mobile primary navigation">
					<div className="grid gap-4">
						<section>
							<h3 className="mb-1 px-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
								Explore
							</h3>
							<ul className="grid gap-1">
						{items.map(({ title, href }) => {
							const active = isNavigationItemActive(pathname, href, items);
							return (
								<li key={href}>
									<Link
										className={itemClass(active)}
										aria-current={active ? "page" : undefined}
										to={href}
										onClick={handleClose}
									>
										{title}
									</Link>
									</li>
								);
						})}
						{action && (
							<li>
								<Link
									className={cn(itemClass(isNavigationItemActive(pathname, action.href, [action])), "bg-primary text-primary-foreground hover:bg-primary/90")}
									aria-current={isNavigationItemActive(pathname, action.href, [action]) ? "page" : undefined}
									to={action.href}
									onClick={handleClose}
								>
									{action.title}
								</Link>
							</li>
						)}
							</ul>
						</section>
						{moreGroups.map((group) => (
							<section key={group.label} className="border-t border-border pt-3">
								<h3 className="mb-1 px-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
									{group.label}
								</h3>
								<ul className="grid gap-1">
									{group.items.map((item) => {
										const active = isNavigationItemActive(
											pathname,
											item.href,
											group.items,
										);
										return (
											<li key={item.href}>
												<Link
													className={itemClass(active)}
													aria-current={active ? "page" : undefined}
													to={item.href}
													onClick={handleClose}
												>
													{item.title}
												</Link>
											</li>
										);
									})}
								</ul>
							</section>
						))}
						<section className="border-t border-border pt-3">
							<ul className="grid gap-1">
						<li>
							{isAuthenticated ? (
								<button
									type="button"
									className={itemClass()}
									onClick={handleSignOut}
								>
									Sign out
								</button>
							) : (
								<button
									type="button"
									className={itemClass()}
									onClick={() => handleNavigate("/account?signup=false")}
								>
									Login / Sign up
								</button>
							)}
						</li>
							</ul>
						</section>
					</div>
				</nav>
			</aside>
		</div>
	) : null;
	const renderedMobileNavigation =
		mobileNavigation && typeof document !== "undefined" && document.body
			? createPortal(mobileNavigation, document.body)
			: mobileNavigation;

	return (
		<div className="ml-auto xl:hidden">
			<Button
				variant="outline"
				size="icon"
				className="size-11 rounded-xl"
				aria-label="Open navigation menu"
				aria-expanded={show}
				aria-controls="mobile-navigation"
				onClick={handleShow}
			>
				<Menu className="size-5" aria-hidden="true" />
			</Button>
			{renderedMobileNavigation}
		</div>
	);
};

export default HeaderToggle;
