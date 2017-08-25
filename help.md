# User Guide

> Welcome! This guide will walk you through the basics of using Zulip Desktop.


## Get Zulip Desktop



## Connect to a Server

### Connect through a proxy

It's possible to connect to your server through a proxy. 
You can enter the proxy settings in the `Network` section of App Settings. 
There are three fields provided:
* `PAC script` - The URL associated with the PAC file.
* `Proxy rules` - Rules indicating which proxies to use.
* `Proxy bypass rules` - Rules indicating which URLs should
    bypass the proxy settings.
	
For a typical setup where internet access is required to use an HTTP proxy,
but URLs on the local network should be accessed directly, configure as follows:

`Proxy rules = proxy.example.com`

Your HTTP proxy server
`Proxy bypass rules = *.example.com;10.0.0.0/8`

Directly connect to your own domain and private IP subnet
for more complex setups, read below to configure complex proxy rules and proxy bypass rules.

### Sets the proxy settings.

When `PAC script` and `Proxy rules` are provided together, the `Proxy rules`
option is ignored and `PAC script` configuration is applied.

The `Proxy rules` has to follow the rules below:

```
proxyRules = schemeProxies[";"<schemeProxies>]
schemeProxies = [<urlScheme>"="]<proxyURIList>
urlScheme = "http" | "https" | "ftp" | "socks"
proxyURIList = <proxyURL>[","<proxyURIList>]
proxyURL = [<proxyScheme>"://"]<proxyHost>[":"<proxyPort>]
```

For example:

* `http=foopy:80;ftp=foopy2` - Use HTTP proxy `foopy:80` for `http://` URLs, and
  HTTP proxy `foopy2:80` for `ftp://` URLs.
* `foopy:80` - Use HTTP proxy `foopy:80` for all URLs.
* `foopy:80,bar,direct://` - Use HTTP proxy `foopy:80` for all URLs, failing
  over to `bar` if `foopy:80` is unavailable, and after that using no proxy.
* `socks4://foopy` - Use SOCKS v4 proxy `foopy:1080` for all URLs.
* `http=foopy,socks5://bar.com` - Use HTTP proxy `foopy` for http URLs, and fail
  over to the SOCKS5 proxy `bar.com` if `foopy` is unavailable.
* `http=foopy,direct://` - Use HTTP proxy `foopy` for http URLs, and use no
  proxy if `foopy` is unavailable.
* `http=foopy;socks=foopy2` -  Use HTTP proxy `foopy` for http URLs, and use
  `socks4://foopy2` for all other URLs.

The `Proxy bypass rules` is a comma separated list of rules described below:

* `[ URL_SCHEME "://" ] HOSTNAME_PATTERN [ ":" <port> ]`

   Match all hostnames that match the pattern HOSTNAME_PATTERN.

   Examples:
     "foobar.com", "*foobar.com", "*.foobar.com", "*foobar.com:99",
     "https://x.*.y.com:99"

 * `"." HOSTNAME_SUFFIX_PATTERN [ ":" PORT ]`

   Match a particular domain suffix.

   Examples:
     ".google.com", ".com", "http://.google.com"

* `[ SCHEME "://" ] IP_LITERAL [ ":" PORT ]`

   Match URLs which are IP address literals.

   Examples:
     "127.0.1", "[0:0::1]", "[::1]", "http://[::1]:99"

*  `IP_LITERAL "/" PREFIX_LENGHT_IN_BITS`

   Match any URL that is to an IP literal that falls between the
   given range. IP range is specified using CIDR notation.

   Examples:
     "192.168.1.1/16", "fefe:13::abc/33".

*  `<local>`

   Match local addresses. The meaning of `<local>` is whether the
   host matches one of: "127.0.0.1", "::1", "localhost".


## Change App Preferences



## Reporting an Issue
