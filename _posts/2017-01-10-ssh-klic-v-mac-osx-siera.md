---
layout: post
title: SSH klíč v mac OSX Sierra
tags: mac
---

Pokud máte maca, a připojujete se z terminálu na různé servery. Tak jste si pravděpodobně všimli že po upgradu na Sierru se přestaly načítat privátní klíče do `ssh-agent`. Vypadá to tak že se Apple pro naše dobro rozhodl změnit chování.

Naštěstí je "oprava" triviální.

Celé co je potřeba udělat je upravit `./ssh/config`.

{% highlight config %}
Host *
 IdentityFile ~/.ssh/id_rsa
 AddKeysToAgent yes
 UseKeychain yes
{% endhighlight %}

<!-- more -->
<a name="more"></a>

