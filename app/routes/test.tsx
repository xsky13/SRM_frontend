import type { Route } from "./+types/test";

import { Tab, TabList, TabPanel, TabPanels, Tabs } from "~/components/ui/Tabs";
import { useEffect, useState } from "react";
import FileInput from "~/components/ui/FileInput";
import { Menu, MenuItem, MenuTrigger } from "~/components/ui/Menu";
import { Button } from "~/components/ui/Button";
import { Ellipsis } from "lucide-react";
import { Select, SelectItem } from "~/components/ui/Select";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Test() {
	let [tabs, setTabs] = useState([
		{ id: 1, title: 'Tab 1', content: 'Tab body 1' },
		{ id: 2, title: 'Tab 2', content: 'Tab body 2' },
		{ id: 3, title: 'Tab 3', content: 'Tab body 3' }
	]);

	let items = [
		{ id: 1, name: 'New file…' },
		{ id: 2, name: 'New window' },
		{ id: 3, name: 'Open…' },
		{ id: 4, name: 'Save' },
		{ id: 5, name: 'Save as…' },
		{ id: 6, name: 'Revert file' },
		{ id: 7, name: 'Print…' },
		{ id: 8, name: 'Close window' },
		{ id: 9, name: 'Quit' }
    ];

    const query = useQuery({
        queryKey: ["todos"],
        queryFn: () => api.get("/info")
    });

    useEffect(() => {
        console.log(query.data)
    }, [query])

	return (
		<>
			<Select label="Favorite Animal" className={"ml-40"}>
				<SelectItem>Aardvark</SelectItem>
				<SelectItem>Cat</SelectItem>
				<SelectItem>Dog</SelectItem>
				<SelectItem>Kangaroo</SelectItem>
				<SelectItem>Panda</SelectItem>
				<SelectItem>Snake</SelectItem>
			</Select>
			<MenuTrigger>
				<Button aria-label="Actions">
					<Ellipsis size={18} />
				</Button>
				<Menu items={items}>
					{(item) => <MenuItem>{item.name}</MenuItem>}
				</Menu>
			</MenuTrigger>

			<Tabs>
				<div >
					<TabList
						aria-label="Dynamic tabs"
						items={tabs}

						style={{ flex: 1 }}>
						{item => <Tab>{item.title}</Tab>}
					</TabList>
				</div>
				<TabPanels items={tabs}>
					{item => <TabPanel>{item.content}</TabPanel>}
				</TabPanels>
			</Tabs>

		</>
	);
}
