import * as t from '../utils/translation-util';
import BaseComponent from './base';

export interface AuthenticationDialogResult {
	username: string;
	password: string;
}

export default class Dialog extends BaseComponent {
	private $el: HTMLElement;

	init() {
		this.$el = document.querySelector('#dialog');
	}

	async showAuthenticationDialog(): Promise<AuthenticationDialogResult> {
		return new Promise((resolve, reject) => {
			this.$el.innerHTML = this.authenticationDialogTemplate();
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
				this.hide();
				$pass.value = '';
			});
			$cancel.addEventListener('click', () => {
				reject();
				this.hide();
				$pass.value = '';
			});
			this.show();
		});
	}

	private show() {
		this.$el.style.display = 'block';
	}

	private hide() {
		this.$el.style.display = 'none';
	}

	private authenticationDialogTemplate(): string {
		return `
			<h3>${t.__('Authentication required')}</h3>
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
