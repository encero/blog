---
layout: post
title: Facebook notifikace "Fire and forget"
tags: cookbook notifikace node.js facebook
---

{% comment %}
  - motivační text
  - cíle
  - krátce o facebook notifikacích
  - použité technologie
  - setup projektu
{% endcomment %}

Pokud jste někdy vyvíjeli aplikaci pro Facebook, určitě víte jaké můžou být potíže s používáním FB nástrojů. U API pro vývojařé je to hlavně rychlost odezvy a dokumentace. S dokumentací toho moc neuděláme, ale v některých případech si můžeme poradit se zpomalením naší stránky.

Takovým případem jsou třeba FB notifikace. A já vám ukážu jednu zmožných cest jak si snimi ulehčit práci, tím že předáme většinu zodpovědnosti třetí straně.

<!-- more -->
<a name="more"></a>

## Fire and Forget

Z vojenské terminologie jsou rakety "[Fire and Forget][faf-wiki]" takové, které zaměříte, vypálíte a zapomenete na ně. Naváděcí systém se pak bez přičinění operátora postará o správnou dráhu a případné zasažení cíle.

Na stejném principu postavíme [node.js][node.js] server. Který bude zodpovědný za odeslání notifikací. My mu jen poskytneme potřebné informace a s klidem na něj zapomeneme.

## Facebook notifikace

Pro účely toho návodu budu předpokládat že jste seznámení se základním vývojem na FB platformě. Ty zvás kteří si chtějí doplnit znalosti odkážu na [dokumentaci FB][doc-main] a [notifikací][doc-notif].

V doporučeních FB je pár pravidel které by jste měli při posílání notifikací vzít v úvahu.

- **Jen aktivní uživatelé**  
  neposílejte pravidelně notifikace uživatelům, kteří nebyli měsíc a více aktivní ve Vaší aplikaci.
- **Krátké texty**  
  z praxe můžu potvrdit, že nejlépe fungují krátké texty notifikací. Čím kratší tím lepší (Samozřejmě s rozumem)
- **Maximalně dvě deně**  
  podle FB jsou dvě notifikace v jeden den, hranice kdy budou uživatelé reagovat. Popřípadě vaši notifikaci rovnou označí za spam.

API end point pro notifikace je (SSL je vyzadovano FB API kvuli pritomnosti access tokenu v query) `https://graph.facebook.com/{user_id}/notifications`.

parametry volani API

- `access_token` aplikační nebo user access_token  
  aplikační `access_token` získáme podle [návodu][fb-app-token] nebo použijeme formát `access_token={id aplikace}|{secret aplikace}`
- `template` text notifikace (omezení na 180 znaků)
- `href` relativní url v aplikačním Canvasu

## Jdeme na to

Celou aplikaci budu stavět nad node.js a sadě [npm][npm] balíků pro zjednodušení práce.

Budeme potřebovat běhové prostředí Node.js které získáme na [stránkách projektu][node.js]. S instalaci Node.js dostaneme i *node package manager* který také využijeme.

### Začínáme

Založíme si novou Node aplikaci. Vytvoření `package.json` nechame na `npm` příkazem `npm init`.

{% highlight bash %}
$ mkdir notif
$ cd notif/
$ npm init
{% endhighlight %}

Máme vytvořený `package.json` který by měl vypadat zhruba takto.

{% highlight json %}
{
  "name": "notif",
  "version": "0.0.0",
  "description": "Facebook notification service",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Matouš Michalík",
  "license": "MIT"
}
{% endhighlight %}

Další krok je nainstalovat závislosti pomocí `npm`. Budeme potřebovat tyto:

- Knihovnu pro zjednodušení práce s http requesty [request][pkg-request]
- REST framework [restify][pkg-restify]

{% highlight bash %}
$ npm install --save request restify
{% endhighlight %}

Npm stáhnul potřebné knihovny a vytvořil složku `node_modules` a do `package.json` nám přepínačem `--save` přibyly závislosti.

### Notifikační služba rychle a jednoduše

Celý kód serveru se nám vešel na 51 řádek. Samozřejmě jsou možné další vylepšení a úpravy.

{% highlight javascript %}
var restify = require('restify')
  , request = require('request');

var server = restify.createServer();

server.use(restify.bodyParser({
    maxBodySize: 1024*1024
 }));

server.post('/notification', function (req, res, next) {
  var parameters = req.params;

  if ( typeof parameters.ids !== 'undefined' &&
     typeof parameters.message !== 'undefined' &&
     typeof parameters.access_token !== 'undefined' ) {

    res.send({status:'ok'});

    var ids = parameters.ids;
    if (typeof ids === 'string'){
      ids = ids.split(',');
    }

    if (typeof ids !== 'object'){
      ids = [ids];
    }

    for (var i = 0; i < ids.length; i++){
      request.post( 'https://graph.facebook.com/' + ids[i] + '/',
      {form: {
        access_token: parameters.access_token,
        message: parameters.message
      }}, function (error, request, body){
        console.log('notification response', body);
      });
    }

  } else {
    var message = 'missing required parameter';

    console.log(message);

    res.send({
      status:'error',
      message: message
    });
  }

  next();
});

server.listen(8080, function(){
  console.log('server listen on port 8080');
});
{% endhighlight %}

### Zdroják krok po kroku

Jako skoro v každém jazyce i v `node.js` začíná soubor načtením používaných
knihoven. Tady není co vyslvětlovat.

{% highlight javascript %}
var restify = require('restify')
  , request = require('request');
{% endhighlight %}

Vytvoříme si instanci `restify` serveru. Pomocí `server.use()` si zaregistrujeme `bodyParser`
který nám zajistí uložení parametrů requestu do `request.params`. 

`bodyParser` podporuje data ve formátu `json` , `x-www-form-urlencoded` a `multipart/form-data`
formát se určuje podle hlavičky `Content-Type`.

{% highlight javascript %}
var server = restify.createServer();

server.use(restify.bodyParser({
    maxBodySize: 1024*1024
 }));
{% endhighlight %}

Restify nám dává jednoduchý způsobů pro registraci handlerů.

Formát je `sever.{HTTP metoda}(url, funkce)`. Podporované metody jsou.

- get
- post
- put
- head
- del

Naše služba bude dostupná na adrese `http://sever:port/notification`.

{% highlight javascript %}
server.post('/notification', function (req, res, next) {
  ...
})
{% endhighlight %}

Do naší anonymní funkce dostaneme parametry `req, res, next`. Jde o objekt dotazu,
odpovědi a callback next. `next` je funkce kterou musíme zavolat. Dáme tím vědět
frameworku restify že může pokračovat ve své práci.

V `req.params` najdeme všechny parametry které nám připravil `bodyParser`.

V jednoduché podmínce provedeme naivní kontrolu na přítomnost povinných parametrů.

{% highlight javascript %}
function (req, res, next) {
  var parameters = req.params;

  if ( typeof parameters.ids !== 'undefined' &&
     typeof parameters.message !== 'undefined' &&
     typeof parameters.access_token !== 'undefined' ) {
     ...
  }
{% endhighlight %}

Vzhledem k tomu že nám jde o zrychlení na straně klientské aplikace, tak hned po
ověření parametrů pošleme zpět odpověď. Tím minimalizujeme dobu čekání.

Nevýhodou u tohoto přístupu je nemožnost získat zpětnou vazbu.

{% highlight javascript %}
if ( ... ) {
  res.send({status:'ok'});
}
{% endhighlight %}

Podle použitého technologie na straně klienta může parametr `ids` přijít jako string
nebo jako číslo. Proto musíme provést kontrolu a přetypování na požadovaný formát.

{% highlight javascript %}
if ( ... ) {
  ...

  var ids = parameters.ids;
  if (typeof ids === 'string'){
    ids = ids.split(',');
  }

  if (typeof ids !== 'object'){
    ids = [ids];
  }
}
{% endhighlight %}

API jsme navrhli tak aby mohlo posílat stejnou notifikaci více uživatelům najednou.
Proměnou `ids` jsme si tedy *znomralizovali* na pole a ted ho projdeme v cyklu a provedeme
fyzické volání FB API.

Samotné volání je už jednoduché a myslím že nepotřebuje vysvětlení.

{% highlight javascript %}
if ( ... ) {
  ...

  for (var i = 0; i < ids.length; i++){
    request.post( 'https://graph.facebook.com/' + ids[i] + '/',
    {form: {
      access_token: parameters.access_token,
      message: parameters.message
    }}, function (error, request, body){
      console.log('notification response', body);
    });
  }
}
{% endhighlight %}

Máme hotový handler, teď jen spustíme samotný server na portu který nám vyhovuje.

{% highlight javascript %}
server.listen(8080, function(){
  console.log('server listen on port 8080');
});
{% endhighlight %}

### Jak API použijeme

Celé si to můžeme vyzkoušet přímo z node pomocí jednoduchého klienta.

{% highlight javascript %}
//client.js
var request = require('request');

var user_id = 12345;

var appId = 'XXXX';
var appSecret = 'XXXX';

request.post('http://localhost:8080/notification', {json:{
    ids:user_id,
    message: 'testing message',
    access_token: appId + '|' + appSecret
  }}, function (error, response, body){
    console.log(body);
});
{% endhighlight %}

Testovací script spustíme:

`$ node client.js`

### Provoz na serveru

Budeme předpokládat, že je naše implementace neprůstřelná (čti bez chyb). Projistotu si ji ale v produkčním prostředí pustíme
supervizorem.

Vhodný kandidát by mohl být [forever][forever]. V node.js napsaná aplikace pro monitoring node.js procesů.

Vpřípadě že náš server spadne na forever zajistí jeho opětovné spuštění. Nástroj nainstalujeme přes `NPM`.
Přepínač `-g` znamená *global* a nainstaluje nám danou aplikaci do `PATH`.

`$ [sudo] npm install forever -g`

Monitorovaný proces pak spustíme jednoduše.

`$ forever script.js`

### A máme hotovo

Vytvořili jsme si jedno účelovou aplikaci, která nám ušetří práci na v klientských aplikacích.
Navíc jsme přesměrovali část práce mimo naši aplikaci a tím zrychlili odpověď pro našeho uživatele.

Někdy příště si náš hodně naivní přístup, vylepšíme a postavíme robustnější modularní aplikaci.

[faf-wiki]: http://en.wikipedia.org/wiki/Fire-and-forget
[node.js]: http://nodejs.org/
[forever]: https://github.com/nodejitsu/forever

[doc-main]: https://developers.facebook.com/docs/
[doc-notif]: https://developers.facebook.com/docs/games/notifications/

[fb-app-token]: https://developers.facebook.com/docs/facebook-login/access-tokens/#apptokens

[npm]: https://www.npmjs.org/

[pkg-request]: https://github.com/mikeal/request
[pkg-restify]: https://www.npmjs.org/package/restify
