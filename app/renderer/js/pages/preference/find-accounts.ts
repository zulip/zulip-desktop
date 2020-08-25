import {htmlEscape} from 'escape-goat';

import BaseComponent from '../../components/base';
import * as LinkUtil from '../../utils/link-util';
import * as t from '../../utils/translation-util';

interface FindAccountsProps {
	$root: Element;
}

export default class FindAccounts extends BaseComponent {
	props: FindAccountsProps;
	$findAccounts: Element | null;
	$findAccountsButton: Element | null;
	$serverUrlField: HTMLInputElement | null;
	constructor(props: FindAccountsProps) {
		super();
		this.props = props;
	}

	templateHTML(): string {
		return htmlEscape`
			<div class="settings-card certificate-card">
				<div class="certificate-input">
					<div>${t.__('Organization URL')}</div>
					<input class="setting-input-value" value="zulipchat.com"/>
				</div>
				<div class="certificate-input">
					<button class="green w-150" id="find-accounts-button">${t.__('Find accounts')}</button>
				</div>
			</div>
		`;
	}

	init(): void {
		this.$findAccounts = this.generateNodeFromHTML(this.templateHTML());
		this.props.$root.append(this.$findAccounts);
		this.$findAccountsButton = this.$findAccounts.querySelector('#find-accounts-button');
		this.$serverUrlField = this.$findAccounts.querySelectorAll('input.setting-input-value')[0] as HTMLInputElement;
		this.initListeners();
	}

	async findAccounts(url: string): Promise<void> {
		if (!url) {
			return;
		}

		if (!url.startsWith('http')) {
			url = 'https://' + url;
		}

		await LinkUtil.openBrowser(new URL('/accounts/find', url));
	}

	initListeners(): void {
		this.$findAccountsButton.addEventListener('click', async () => {
			await this.findAccounts(this.$serverUrlField.value);
		});

		this.$serverUrlField.addEventListener('click', () => {
			if (this.$serverUrlField.value === 'zulipchat.com') {
				this.$serverUrlField.setSelectionRange(0, 0);
			}
		});

		this.$serverUrlField.addEventListener('keypress', async event => {
			if (event.key === 'Enter') {
				await this.findAccounts(this.$serverUrlField.value);
			}
		});

		this.$serverUrlField.addEventListener('input', () => {
			if (this.$serverUrlField.value) {
				this.$serverUrlField.classList.remove('invalid-input-value');
			} else {
				this.$serverUrlField.classList.add('invalid-input-value');
			}
		});
	}
}
