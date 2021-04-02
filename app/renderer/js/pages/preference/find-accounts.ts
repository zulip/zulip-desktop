import type {HTML} from "../../../../common/html";
import {html} from "../../../../common/html";
import * as t from "../../../../common/translation-util";
import {generateNodeFromHTML} from "../../components/base";
import * as LinkUtil from "../../utils/link-util";

interface FindAccountsProps {
  $root: Element;
}

export default class FindAccounts {
  props: FindAccountsProps;
  $findAccounts: Element | null;
  $findAccountsButton: Element | null;
  $serverUrlField: HTMLInputElement | null;
  constructor(props: FindAccountsProps) {
    this.props = props;
  }

  templateHTML(): HTML {
    return html`
      <div class="settings-card certificate-card">
        <div class="certificate-input">
          <div>${t.__("Organization URL")}</div>
          <input class="setting-input-value" value="zulipchat.com" />
        </div>
        <div class="certificate-input">
          <button class="green w-150" id="find-accounts-button">
            ${t.__("Find accounts")}
          </button>
        </div>
      </div>
    `;
  }

  init(): void {
    this.$findAccounts = generateNodeFromHTML(this.templateHTML());
    this.props.$root.append(this.$findAccounts);
    this.$findAccountsButton = this.$findAccounts.querySelector(
      "#find-accounts-button",
    );
    this.$serverUrlField = this.$findAccounts.querySelector(
      "input.setting-input-value",
    );
    this.initListeners();
  }

  async findAccounts(url: string): Promise<void> {
    if (!url) {
      return;
    }

    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    await LinkUtil.openBrowser(new URL("/accounts/find", url));
  }

  initListeners(): void {
    this.$findAccountsButton.addEventListener("click", async () => {
      await this.findAccounts(this.$serverUrlField.value);
    });

    this.$serverUrlField.addEventListener("click", () => {
      if (this.$serverUrlField.value === "zulipchat.com") {
        this.$serverUrlField.setSelectionRange(0, 0);
      }
    });

    this.$serverUrlField.addEventListener("keypress", async (event) => {
      if (event.key === "Enter") {
        await this.findAccounts(this.$serverUrlField.value);
      }
    });

    this.$serverUrlField.addEventListener("input", () => {
      if (this.$serverUrlField.value) {
        this.$serverUrlField.classList.remove("invalid-input-value");
      } else {
        this.$serverUrlField.classList.add("invalid-input-value");
      }
    });
  }
}
