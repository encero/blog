---
layout: page
title: Odkladiště příkazů a utilit
order: 5
---

### GIT

`git shortlog -sn`: žebříček přispěvatelů do repa podle počtu commitů

### OSX

`ncdu`: pocitadlo velikosti slozek

`tig`: konzolova utilita pro praci s gitem

`devd`: sikovny vyvojovy server s live reloadem

`sudo ifconfig lo0 alias 169.254.254.254`: alias pro loopback interface ( dostupny z docker containeru bezicich na danem hostu )

### DOCKER

vyrobi zaznam v /etc/hosts ktery ukazuje na hostujici masinu
{% highlight bash %}
echo -e "`/sbin/ip route|awk '/default/ { print $3 }'`\tdocker.host.internal" | tee -a /etc/hosts > /dev/null
{% endhighlight%}

### OTHER

gource to video ( na macu funguje gource instalované přes brew )

{% highlight bash %}
gource --highlight-users -s 1 -a 0.3 --bloom-intensity 0.5 --hide filenames,progress --bloom-multiplier 0.75 -o gource.ppm -r 60 
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset medium -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 gource.mp4
{% endhighlight %}
