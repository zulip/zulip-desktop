// unescape already encoded/escaped strings
export function decodeString(stringInput: string): string {
	const parser = new DOMParser();
	const dom = parser.parseFromString(
		'<!doctype html><body>' + stringInput,
		'text/html');
	return dom.body.textContent;
}
