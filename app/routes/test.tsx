
import type { Route } from "./+types/test";

import { Tab, TabList, TabPanel, TabPanels, Tabs } from "~/components/ui/Tabs";
import { useEffect, useState } from "react";
import { Select, SelectItem } from "~/components/ui/Select";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";
import { Button } from "~/components/ui/Button";
import { queue } from "~/components/ui/Toast";

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

    const query = useQuery({
        queryKey: ["todos"],
        queryFn: () => api.get("/info"),
        meta: { errorMessage: 'No pudimos cargar las reservas de esta propiedad' },
    });

    // useEffect(() => {
    //     console.log(query.data)
    // }, [query])

    // if (query.isPending) return 'Loading...'

    // if (query.isError) return JSON.stringify(query.error)

	return (
        <>
            <Button onPress={() => queue.add(
                {
                  title: 'Files uploaded',
                  description: '3 files uploaded successfully.'
                },
                { timeout: 3000}
              )}>add</Button>
			<Select label="Favorite Animal" className={"ml-40"}>
				<SelectItem>Aardvark</SelectItem>
				<SelectItem>Cat</SelectItem>
				<SelectItem>Dog</SelectItem>
				<SelectItem>Kangaroo</SelectItem>
				<SelectItem>Panda</SelectItem>
				<SelectItem>Snake</SelectItem>
			</Select>

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
