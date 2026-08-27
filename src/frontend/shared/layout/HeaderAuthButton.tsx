import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { authActions } from "@/features/auth/state/authSlice";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import convertImage from "@/shared/utils/convertImage";
import Button from "@/shared/ui/Button";
import { useToast } from "@/app/ToastProvider";
import type { AppDispatch } from "@/app/store";

export type AuthUser = {
	user_id?: number;
	full_name?: string | null;
};

export type AuthBucket = {
	isAuthenticated: boolean;
	user: AuthUser | null;
};

export type AuthState = {
	local: AuthBucket;
	session: AuthBucket;
};

const menuLink =
	"flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type HeaderAuthButtonProps = {
	auth: AuthState;
};

const HeaderAuthButton = ({
	auth,
}: HeaderAuthButtonProps): ReactElement => {
	const { local, session } = auth;
	const [clicked, setClicked] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const toggleRef = useRef<HTMLButtonElement | null>(null);
	const closeMenu = useCallback(() => {
		setClicked(false);
		toggleRef.current?.focus();
	}, []);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user = local.isAuthenticated ? local.user : session.user;
	const accountLabel = user?.full_name || "Your account";
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { showToast } = useToast();

	useEffect(() => {
		if (!clicked || typeof document === "undefined") return undefined;
		const handlePointerDown = (event: PointerEvent): void => {
			if (!(event.target instanceof Node)) return;
			if (
				!menuRef.current?.contains(event.target) &&
				!toggleRef.current?.contains(event.target)
			) {
				closeMenu();
			}
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
	}, [clicked, closeMenu]);

	const handleSignOut = async (): Promise<void> => {
		try {
			await authSessionApi.logout();
		} catch {
			// Local auth must still clear when the server is unavailable.
		} finally {
			dispatch(authActions.logout());
			showToast({ title: "Signed out" });
			closeMenu();
			navigate("/");
		}
	};

	return (
		<div className="relative ml-auto hidden lg:block">
			{isAuthenticated ? (
				<>
					<button
						type="button"
						ref={toggleRef}
						className="relative flex size-11 items-center justify-center rounded-full bg-muted p-1 text-sm font-bold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-expanded={clicked}
						aria-haspopup="menu"
						aria-controls={clicked ? "header-auth-menu" : undefined}
						aria-label={`Open account menu for ${accountLabel}`}
						title={accountLabel}
						onClick={() => setClicked((value) => !value)}
					>
						{convertImage("avatar", "size-9 rounded-full object-cover")}
						<span className="sr-only">{accountLabel}</span>
						<ChevronDown className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-card text-foreground" aria-hidden="true" />
					</button>
					{clicked && (
						<div
							id="header-auth-menu"
							ref={menuRef}
							className="absolute right-0 top-[calc(100%+0.6rem)] z-50 grid min-w-48 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl"
							role="menu"
						>
							<Link
								className={menuLink}
								to="/profile"
								role="menuitem"
								onClick={closeMenu}
							>
								<UserRound className="size-4" />
								My profile
							</Link>
							<Link
								className={`${menuLink} text-destructive`}
								to="/"
								role="menuitem"
								onClick={handleSignOut}
							>
								<LogOut className="size-4" />
								Sign out
							</Link>
						</div>
					)}
				</>
			) : (
				<Button type="button" size="icon" aria-label="Login / Sign up" title="Login / Sign up" onClick={() => navigate("/account?signup=false")}>
					<UserRound className="size-4" aria-hidden="true" />
					<span className="sr-only">Login / Sign up</span>
				</Button>
			)}
		</div>
	);
};

export default HeaderAuthButton;
