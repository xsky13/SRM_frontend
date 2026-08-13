'use client';
import { Link as RACLink, type LinkProps } from 'react-aria-components/Link';
import './Link.css';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';

export function Link(props: LinkProps) {
	return <RACLink {...props} className={composeRenderProps(props.className, (className) =>
		`react-aria-Link ${className ?? ''}`.trim()
	)} />;
}
