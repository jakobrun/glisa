function tabs($) {
	'use strict';
	return function(content){
		var tabs = content.find('ul.tabs'),
			links = content.find('a.tab'),
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

		function initTab(link, body, closelink){
			var tab =	{link: link,
							body: body,
							show: function(){
								active.link.removeClass('active');
								active.body.slideUp();
								link.addClass('active');
								body.slideDown();
								active = tab;
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

			link.click( function(){
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
			var link = $('<a/>',{href: '#'+id}).text(title),
				closelink = $('<a/>',{href: '#'+id}).addClass('icons-closetab').attr('data-icon','x'),
				li = $('<li/>'),
				body = $(html);

			li.append(link).append(closelink);
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