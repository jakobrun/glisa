function tabs($) {
	'use strict';
	return function(content, listener){
		var tabs = content.find('.tabs ul'),
			links = content.find('a.tab'),
			menuLink = content.find('.menu'),
			tabList = [],
			active;

		links.each( function(index, linkElm){
			var link = $(linkElm),
				l    = link.attr('href'),
				id   = l.slice(l.indexOf("#")+1),
				body = $('#'+id),
				tab  = initTab(link, body);

			if(!link.hasClass('active')){
				body.hide();
			} else {
				active = tab;
			}
		});
		if(content.find('.menu:visible').length>0){
			tabs.hide();
		}

		menuLink.click( function (){
			tabs.slideToggle();
		});

		function initTab(link, body, closelink){
			var tab =	{link: link,
							body: body,
							show: function(){
								active.link.removeClass('active');
								active.body.hide();
								link.addClass('active');
								body.show();
								active = tab;
								if(listener){
									listener.onTabSelected({tab: tab,index: tabList.indexOf(tab)});
								}
							},
							close: function(){
								var index = tabList.indexOf(tab);
								tabList.splice(index,1);
								if(tab===active){
									if(index>=tabList.length) index = tabList.length-1;

									tabList[index].show();
								}
								link.parent().remove();
								body.remove();
							}
						};

			link.click( function(e){
				tab.show();
			});
			if(closelink){
				closelink.click(function (e){
					e.preventDefault();
					tab.close();
				});
			}
			tabList.push(tab);
			return tab;
		}

		function addTab(id, title, html){
			var link = $('<a/>',{href: '#'+id}).addClass('tab').text(title),
				closelink = $('<a/>',{href: '#'+id}).addClass('icons-closetab').attr('data-icon','x'),
				li = $('<li/>'),
				body = $(html);

			li.append(closelink).append(link);
			tabs.append(li);
			link.attr('href','#'+id).text(title);
			content.append(body);
			body.hide();
			return initTab(link, body, closelink);
		}

		return {
			addTab: addTab
		};
	};
}
module.exports = tabs($);