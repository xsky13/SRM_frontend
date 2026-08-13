import { Button } from "~/components/ui/Button";
import type { Route } from "./+types/home";
import { Tag, TagGroup } from "~/components/ui/TagGroup";
import { Calendar } from "~/components/ui/Calendar";
import { Checkbox } from "~/components/ui/Checkbox";
import { DatePicker } from "~/components/ui/DatePicker";
import { TextField } from "~/components/ui/TextField";
import { DateRangePicker } from "~/components/ui/DateRangePicker";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "~/components/ui/Tabs";
import { useState } from "react";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Home() {
	let [tabs, setTabs] = useState([
		{ id: 1, title: 'Tab 1', content: 'Tab body 1' },
		{ id: 2, title: 'Tab 2', content: 'Tab body 2' },
		{ id: 3, title: 'Tab 3', content: 'Tab body 3' }
	]);

	return (
		<>
			<Tabs>
				<div style={{ display: 'flex' }}>
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

			<TextField />


			<div className="ml-40">
				<DateRangePicker
					isOpen={true}
					minValue={today(getLocalTimeZone())}
				/>
			</div>
			<DatePicker className="w-40 m" label="Date" />
			<Checkbox className="ml-10" />
			<header className="flex justify-around py-3">
				<h1 className="font-bold text-3xl">Reservas Moreno</h1>
				<ul className="flex gap-16 items-center">
					<li>Legal</li>
					<li>Mi cuenta</li>
					<li>
						<Button>Salir</Button>
					</li>
				</ul>
			</header>
			<div className="py-10 block m-auto w-9/12">
				<div className="flex justify-between items-end">
					<div>
						<h1 className="text-5xl font-semibold">Reserva en dpto 1</h1>
						<Button variant="secondary" className="mt-5">Opciones avanzadas</Button>
					</div>
					<div className="flex flex-col items-center gap-y-3">
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Monto restante</p>
						<div className="text-3xl font-semibold">$30000</div>
						<Button className="w-28 pb-[0.118rem] mt-1">
							Pagar ya
						</Button>
					</div>
				</div>
				<div className="my-7 px-6 py-8 rounded-2xl flex justify-around gap-4 gradient-item">
					<div className="px-5 py-4 rounded-xl text-center">
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Inicio</p>
						<p className="text-[#4a463d] font-medium">13 de junio</p>
					</div>

					<div className="px-5 py-4 rounded-xl text-center">
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Fin</p>
						<p className="text-[#4a463d] font-medium">13 de junio</p>
					</div>

					<div className="px-5 py-4 rounded-xl text-center">
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Ubicación</p>
						<p className="text-[#4a463d] font-medium">Departamento 1</p>
					</div>

					<div className="px-5 py-4 rounded-xl text-center">
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Estado</p>
						<p className="text-red-700 font-semibold">
							Confirmada, pago no completo
						</p>
					</div>
				</div>

				<div className="my-10 flex justify-between items-center">
					<h3 className="text-3xl font-medium">Pagos hechos</h3>
				</div>

				<div className="mt-6 divide-y divide-gray-200 border-b border-gray-200">

					<div className="flex items-center justify-between py-4 px-1">
						<div className="flex items-center gap-4">
							<div className="text-xl font-bold tabular-nums w-24">$10.000</div>
							<TagGroup selectionMode="none">
								<Tag>Pago virtual</Tag>
								<Tag>Seña</Tag>
							</TagGroup>
						</div>
						<span className="text-sm text-muted-foreground">6/5/23</span>
					</div>


				</div>
				<p className="mt-5 italic">Debe pagar el resto de la reserva para terminar su estadia.</p>
				{/*<div className="my-10 flex justify-between">
                    <h3 className="text-3xl font-medium">Pagos hechos</h3>
                </div>

                <div className="mt-10">
                    <div className="flex justify-between items-center border-b border-gray-200 w-full pb-3 px-3">
                        <div className="text-xl font-bold">$10000</div>
                        <span>Manual: no</span>
                        <span>Seña: si</span>
                        <span className="text-sm text-muted-foreground font-medium">Fecha de pago: 6/5/23</span>
                    </div>
                </div>*/}
			</div>
		</>
	);
}
