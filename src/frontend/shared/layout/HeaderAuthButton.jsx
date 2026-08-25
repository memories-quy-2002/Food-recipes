import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { authActions } from "@/features/auth/state/authSlice";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import convertImage from "@/shared/utils/convertImage";
import Button from "@/shared/ui/Button";
import { useToast } from "@/app/ToastProvider";

const menuLink = "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const HeaderAuthButton = ({ auth }) => {
	const { local, session } = auth;
	const [clicked, setClicked] = useState(false);
	const menuRef = useRef(null);
	const toggleRef = useRef(null);
	const closeMenu = useCallback(() => { setClicked(false); toggleRef.current?.focus(); }, []);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user = local.isAuthenticated ? local.user : session.user;
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { showToast } = useToast();

	useEffect(() => {
		if (!clicked || typeof document === "undefined") return undefined;
		const handlePointerDown = (event) => { if (!menuRef.current?.contains(event.target) && !toggleRef.current?.contains(event.target)) closeMenu(); };
		const handleKeyDown = (event) => { if (event.key === "Escape") { event.preventDefault(); closeMenu(); } };
		document.addEventListener("pointerdown", handlePointerDown); document.addEventListener("keydown", handleKeyDown);
		menuRef.current?.querySelector("a")?.focus();
		return () => { document.removeEventListener("pointerdown", handlePointerDown); document.removeEventListener("keydown", handleKeyDown); };
	}, [clicked, closeMenu]);

	const handleSignOut = async () => {
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
			{isAuthenticated ? <>
				<button type="button" ref={toggleRef} className="flex min-h-11 max-w-52 items-center gap-2 rounded-full bg-muted p-1 pr-3 text-sm font-bold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={clicked} aria-haspopup="menu" aria-controls="header-auth-menu" onClick={() => setClicked((value) => !value)}>
					{convertImage("avatar", "size-9 rounded-full object-cover")}
					<span className="truncate">{user?.full_name || "Your account"}</span><ChevronDown className="size-4 shrink-0" />
				</button>
				{clicked && <div id="header-auth-menu" ref={menuRef} className="absolute right-0 top-[calc(100%+0.6rem)] z-50 grid min-w-48 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl" role="menu"><Link className={menuLink} to="/profile" role="menuitem" onClick={closeMenu}><UserRound className="size-4" />My profile</Link><Link className={menuLink + " text-destructive"} to="/" role="menuitem" onClick={handleSignOut}><LogOut className="size-4" />Sign out</Link></div>}
			</> : <Button type="button" onClick={() => navigate("/account?signup=false")}>Login / Sign up</Button>}
		</div>
	);
};
export default HeaderAuthButton;
