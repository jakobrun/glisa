function tabs($) {
	'use strict';
	return function(content, listener){
		var tabs = content.find('.tabs ul'),
			links = content.find('a.tab'),
			menuLink = content.find('.menu'),
			bodyContainter = content.find('#content'),
			tabList = [],
			active;

		links.each( function(index, linkElm){
			var link = $(linkElm),
				l    = link.attr('href'),
				id   = l.slice(l.indexOf("#")+1),
				body = $('#'+id),
				tab  = initTab(link, body);

			if(!link.parent().hasClass('active')){
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
								active.link.parent().removeClass('active');
								active.body.hide();
								link.parent().addClass('active');
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
									var i = index;
									if(i>=tabList.length) i = tabList.length-1;

									tabList[i].show();
								}
								link.parent().addClass("is-tab-closed");
								closelink.remove();
								setTimeout(function(){
									link.parent().remove();
								},500);
								body.remove();
								if(listener){
									listener.onTabRemoved({tab: tab, index: index});
								}
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
			bodyContainter.append(body);
			body.hide();
			return initTab(link, body, closelink);
		}

		return {
			addTab: addTab
		};
	};
}
module.exports = tabs($);