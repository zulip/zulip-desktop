import * as t from '../utils/translation-util';

export interface AuthenticationDialogResult {
	username: string;
	password: string;
}

export default class Dialog {
	private readonly $root: HTMLElement;
	private $el: HTMLElement;

	constructor() {
		this.$root = document.querySelector('body');
	}

	async showAuthenticationDialog(url: string, hidden = false): Promise<AuthenticationDialogResult> {
		return new Promise((resolve, reject) => {
			this.init();
			this.$el.innerHTML = this.authenticationDialogTemplate(url);
			const $form = this.$el.querySelector('form');
			const $user: HTMLInputElement = this.$el.querySelector('#dialogAuthUser');
			const $pass: HTMLInputElement = this.$el.querySelector('#dialogAuthPass');
			const $submit: HTMLButtonElement = this.$el.querySelector('#dialogAuthSubmit');
			const $cancel = this.$el.querySelector('#dialogAuthCancel');

			[$user, $pass].forEach(input => {
				input.addEventListener('input', () => {
					$submit.disabled = $user.value === '' || $pass.value === '';
				});
			});

			$form.addEventListener('submit', event => {
				event.preventDefault();
				resolve({username: $user.value, password: $pass.value});
				this.dismiss();
				$pass.value = '';
			});
			$cancel.addEventListener('click', () => {
				reject();
				this.dismiss();
				$pass.value = '';
			});
			if (!hidden) {
				this.show();
			}
		});
	}

	show() {
		if (this.$el !== undefined) {
			this.$el.style.display = 'block';
		}
	}

	hide() {
		if (this.$el !== undefined) {
			this.$el.style.display = 'none';
		}
	}

	dismiss() {
		if (this.$el !== undefined) {
			this.$el.remove();
			this.$el = undefined;
		}
	}

	private init() {
		if (this.$el === undefined) {
			this.$el = document.createElement('div');
			this.$el.classList.add('dialog');
			this.$el.style.display = 'none';
			this.$root.append(this.$el);
		}
	}

	private authenticationDialogTemplate(url = ''): string {
		url = url ? `<p class="muted">${url}</p>` : '';
		return `
			<h3>${t.__('Authentication required')}</h3>
			${url}
			<form>
				<p>
					<input id="dialogAuthUser" class="text-input" type="text" placeholder="${t.__('Username')}" />
				</p>
				<p>
					<input id="dialogAuthPass" class="text-input" type="password" placeholder="${t.__('Password')}" />
				</p>
				<p class="btn-row" style="margin-bottom: 0;">
					<button id="dialogAuthCancel" class="btn">Cancel</button>
					<button id="dialogAuthSubmit" class="btn" disabled>Login</button>
				</p>
			</form>
		`;
	}
}
