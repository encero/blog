---
layout: post
title: Asynchroni maily v nette
tags: cookbook nette mail rabbitmq
---

{% comment %}
  - co resim za problem
  - jak jsem ho vyresil
{% endcomment %}

Na projektu [tescorecepty.cz][tsc-cz] neustále řeším všelijakou mailovou komunikaci.
Ať to jsou potvrzení registrace, newslettery, zapomenutá hesla nebo notikace administrátorům.

Původně se maily posílaly okamžitě v modelu nebo presenteru.
Což sebou samozřejmě neslo řadu problému.
Namátkou zdržování requestu v případě kdy se posílalo více mailů najednou.
Selhání celé stránky při neošetřené chybě v mailu a podobně.

Proto jsem začal hledat jiné řešení.

<!-- more -->
<a name="more"></a>

#Fronta nás zachrání

Hlavní část řešení přinesl článek [Filipa Procházky o RabbitMQ][filip-rabbit] a jeho rozšíření do Nette `Kdyby/RabbitMq`.
Dobře mám nástroj který zajistí posílání mailů na pozadí.
Jak ale elegantně dostat do RabbitMQ consumeru samotný mail.

Napsal jsem několik variant, několikrát se spálil a nakonec jsem skončil u velmi jednoduchého řešení.

Jeden producer a consumer pro všechny maily. Do produceru předávám serializovaný objekt s jednoduchým interfacem.

{% highlight php startinline %}
interface IMail {
  function sendMail(IMailer $mailer);
}
{% endhighlight %}

Consumer je pak opět velmi jednoduchý.

{% highlight php startinline %}
class EmailConsumer extends Object
{
    /** @var IMailer */
    protected $mailer;

    /** @var Logger */
    protected $logger;

    function __construct(IMailer $mailer, Logger $logger)
    {
        $this->mailer = $mailer;
        $this->logger = $logger;
    }

    public function send(AMQPMessage $message)
    {
        $task = unserialize($message->body);

        if ($task instanceof IMail) {
            $task->sendMail($this->mailer);
        } else {
            $this->logger
            ->addError('Invalid email task ' . Debugger::dump($task, true));
        }
    }
}
{% endhighlight %}

Pro jednotlivé maily pak vytvořím třídy které implementují `IMail`.
V jejich implementaci se pak nemusím moc omezovat.

V budoucnosti možná budu potřebovat předávat závislosti do deserializovaných objektů.
Druhým parametrem `Imail::sendMail` pak může být Nette container. Třeba mě napadne lepší řešení. Zatím jsem spokojený s tímto.

[tsc-cz]: http://www.tescorecepty.cz/

[filip-rabbit]: https://filip-prochazka.com/blog/kdyby-rabbitmq-aneb-asynchronni-kdyby-events
