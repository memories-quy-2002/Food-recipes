import { useCallback, useState, type ReactElement } from "react";
import { useSelector } from "react-redux";
import HeaderAuthButton, { type AuthState } from "./HeaderAuthButton";
import HeaderBrand from "./HeaderBrand";
import HeaderMenu from "./HeaderMenu";
import HeaderToggle from "./HeaderToggle";
import { getPrimaryNavigation } from "./navigation";
import type { RootState } from "@/app/store";
import HouseholdScopeSelector from "@/features/households/HouseholdScopeSelector";

const Header = (): ReactElement => {
	const [show, setShow] = useState(false);
	const auth = useSelector((state: RootState): AuthState => state.auth);
	const isAuthenticated =
		auth.local?.isAuthenticated || auth.session?.isAuthenticated;
	const items = getPrimaryNavigation(isAuthenticated);
	const handleClose = useCallback(() => setShow(false), []);
	const handleShow = useCallback(() => setShow(true), []);
	return (
		<header className="relative z-40 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8 lg:pt-6">
			<div className="mx-auto flex min-h-16 w-full max-w-[96rem] items-center gap-3 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur sm:px-5 lg:min-h-[72px]">
				<HeaderBrand />
				<HeaderMenu items={items} />
				<div className="ml-auto block min-w-0 shrink-0 sm:hidden"><HouseholdScopeSelector /></div>
				<div className="ml-auto hidden shrink-0 sm:block"><HouseholdScopeSelector /></div>
				<HeaderAuthButton auth={auth} />
				<HeaderToggle
					show={show}
					handleClose={handleClose}
					handleShow={handleShow}
					items={items}
					auth={auth}
				/>
			</div>
		</header>
	);
};

export default Header;
