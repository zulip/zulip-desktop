import { AuthorizationRequest } from '@openid/appauth/built/authorization_request';
import {
	AuthorizationNotifier,
	AuthorizationRequestHandler
} from '@openid/appauth/built/authorization_request_handler';
import { AuthorizationServiceConfiguration } from '@openid/appauth/built/authorization_service_configuration';
import { NodeCrypto } from '@openid/appauth/built/node_support';
import { NodeBasedHandler } from '@openid/appauth/built/node_support/node_request_handler';
import { NodeRequestor } from '@openid/appauth/built/node_support/node_requestor';
import { StringMap } from '@openid/appauth/built/types';
import {
	GRANT_TYPE_AUTHORIZATION_CODE,
	GRANT_TYPE_REFRESH_TOKEN,
	TokenRequest
} from '@openid/appauth/built/token_request';
import {
	BaseTokenRequestHandler,
	TokenRequestHandler
} from '@openid/appauth/built/token_request_handler';
import {
	TokenResponse
} from '@openid/appauth/built/token_response';

import EventEmitter = require('events');
import dotenv = require('dotenv');

class AuthStateEmitter extends EventEmitter {
	static ON_TOKEN_RESPONSE = 'on_token_response';
}

dotenv.config();

const requestor = new NodeRequestor();
const openIdConnectUrl = 'https://accounts.google.com';
const clientId = process.env.CLIENT_ID;
const redirectUri = 'http://localhost:8000';
const scope = 'openid profile';

class AppAuthUtil {
	notifier: AuthorizationNotifier;
	authorizationHandler: AuthorizationRequestHandler;
	tokenHandler: TokenRequestHandler;
	authStateEmitter: AuthStateEmitter;
	configuration: AuthorizationServiceConfiguration | undefined;
	refreshToken: string | undefined;
	accessTokenResponse: TokenResponse | undefined;

	constructor() {
		this.notifier = new AuthorizationNotifier();
		this.authStateEmitter = new AuthStateEmitter();
		this.authorizationHandler = new NodeBasedHandler();
		this.tokenHandler = new BaseTokenRequestHandler(requestor);
		// set notifier to deliver responses
		this.authorizationHandler.setAuthorizationNotifier(this.notifier);
		// set a listener to listen for authorization responses
		// make refresh and access token requests.
		this.notifier.setAuthorizationListener((request, response, error) => {
			if (response) {
				let codeVerifier: string | undefined;
				if (request.internal && request.internal.code_verifier) {
					codeVerifier = request.internal.code_verifier;
				}

				this.makeRefreshTokenRequest(response.code, codeVerifier)
					.then(result => this.performWithFreshTokens())
					.then(() => {
						this.authStateEmitter.emit(AuthStateEmitter.ON_TOKEN_RESPONSE);
					});
			}
		});
	}

	fetchServiceConfiguration(): Promise<void> {
		return AuthorizationServiceConfiguration.fetchFromIssuer(
			openIdConnectUrl,
			requestor
		).then(response => {
			this.configuration = response;
		});
	}

	makeAuthorizationRequest(username?: string): void {
		if (!this.configuration) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/camelcase
		const extras: StringMap = { prompt: 'consent', access_type: 'offline' };
		if (username) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			extras.login_hint = username;
		}

		// create a request
		const request = new AuthorizationRequest({
			// eslint-disable-next-line @typescript-eslint/camelcase
			client_id: clientId,
			// eslint-disable-next-line @typescript-eslint/camelcase
			redirect_uri: redirectUri,
			scope,
			// eslint-disable-next-line @typescript-eslint/camelcase
			response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
			state: undefined,
			extras
		}, new NodeCrypto());

		this.authorizationHandler.performAuthorizationRequest(
			this.configuration,
			request
		);
	}

	makeRefreshTokenRequest(code: string, codeVerifier: string | undefined): Promise<void> {
		if (!this.configuration) {
			return Promise.resolve();
		}

		const extras: StringMap = {};

		if (codeVerifier) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			extras.code_verifier = codeVerifier;
		}

		// use the code to make the token request.
		const request = new TokenRequest({
			// eslint-disable-next-line @typescript-eslint/camelcase
			client_id: clientId,
			// eslint-disable-next-line @typescript-eslint/camelcase
			redirect_uri: redirectUri,
			// eslint-disable-next-line @typescript-eslint/camelcase
			grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
			code,
			// eslint-disable-next-line @typescript-eslint/camelcase
			refresh_token: undefined,
			extras
		});

		return this.tokenHandler
			.performTokenRequest(this.configuration, request)
			.then(response => {
				this.refreshToken = response.refreshToken;
				this.accessTokenResponse = response;
				return response;
			})
			.then(() => { });
	}

	loggedIn(): boolean {
		return Boolean(this.accessTokenResponse) && this.accessTokenResponse.isValid();
	}

	signOut(): void {
		// forget all cached token state
		this.accessTokenResponse = undefined;
	}

	performWithFreshTokens(): Promise<string> {
		if (!this.configuration) {
			return Promise.reject('Unknown service configuration');
		}
		if (!this.refreshToken) {
			return Promise.resolve('Missing refreshToken.');
		}
		if (this.accessTokenResponse && this.accessTokenResponse.isValid()) {
			// do nothing
			return Promise.resolve(this.accessTokenResponse.accessToken);
		}
		const request = new TokenRequest({
			// eslint-disable-next-line @typescript-eslint/camelcase
			client_id: clientId,
			// eslint-disable-next-line @typescript-eslint/camelcase
			redirect_uri: redirectUri,
			// eslint-disable-next-line @typescript-eslint/camelcase
			grant_type: GRANT_TYPE_REFRESH_TOKEN,
			code: undefined,
			// eslint-disable-next-line @typescript-eslint/camelcase
			refresh_token: this.refreshToken,
			extras: undefined
		});

		return this.tokenHandler
			.performTokenRequest(this.configuration, request)
			.then(response => {
				this.accessTokenResponse = response;
				return response.accessToken;
			});
	}
}

export = AppAuthUtil;
