import { useCallback, useState, type ReactElement } from "react";
import { useSelector } from "react-redux";
import HeaderAuthButton, { type AuthState } from "./HeaderAuthButton";
import HeaderBrand from "./HeaderBrand";
import HeaderMenu from "./HeaderMenu";
import HeaderToggle from "./HeaderToggle";
import {
	getMoreNavigation,
	getPrimaryNavigation,
	getRecipeAction,
} from "./navigation";
import type { RootState } from "@/app/store";
import HouseholdScopeSelector from "@/features/households/HouseholdScopeSelector";
import NotificationCenter from "@/features/notifications/NotificationCenter";

const Header = (): ReactElement => {
	const [show, setShow] = useState(false);
	const auth = useSelector((state: RootState): AuthState => state.auth);
	const isAuthenticated =
		auth.local?.isAuthenticated || auth.session?.isAuthenticated;
	const items = getPrimaryNavigation(isAuthenticated);
	const moreGroups = getMoreNavigation(isAuthenticated);
	const action = getRecipeAction(isAuthenticated);
	const handleClose = useCallback(() => setShow(false), []);
	const handleShow = useCallback(() => setShow(true), []);
	return (
		<header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8">
			<div className="mx-auto flex min-h-16 w-full max-w-[112rem] items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur sm:px-4">
				<HeaderBrand />
				<HeaderMenu items={items} moreGroups={moreGroups} action={action} />
				<div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5">
					<div className="min-w-0 shrink-0"><HouseholdScopeSelector /></div>
					{isAuthenticated && <div className="hidden sm:block"><NotificationCenter /></div>}
					<HeaderAuthButton auth={auth} />
					<HeaderToggle
						show={show}
						handleClose={handleClose}
						handleShow={handleShow}
						items={items}
						moreGroups={moreGroups}
						action={action}
						auth={auth}
					/>
				</div>
			</div>
		</header>
	);
};

export default Header;
