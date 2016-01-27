/*
 *  Copyright (C) 2010-2016 Structr GmbH
 *
 *  This file is part of Structr <http://structr.org>.
 *
 *  Structr is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  Structr is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Structr.  If not, see <http://www.gnu.org/licenses/>.
 */

var win = $(window);
var pagesArea, widgetsArea, statusArea, paWidth, paHeight, currentPage, block = 0, activePreviewDoc, widgetGroups = {};
var appBuilderActiveWidgetTabRightKey = 'structrAppBuilderActiveWidgetTabRightKey' + port;

$(document).ready(function() {
	Structr.registerModule('app-builder', _AppBuilder);
	Structr.classes.push('app');
});

var _AppBuilder = {
	icon: 'icon/page.png',
	add_icon: 'icon/page_add.png',
	delete_icon: 'icon/page_delete.png',
	clone_icon: 'icon/page_copy.png',
	autoRefresh: [],
	init: function() {

		_Pages.clearIframeDroppables();
		main.append('<div id="app-builder"><div id="pages-area"></div><div id="widgets-area"></div></div>');
		pagesArea = $('#pages-area');
		widgetsArea = $('#widgets-area');
		statusArea = $('#status-info');

		_AppBuilder.zoomOut();
		
	},
	refresh: function(page) {
		_Pages.clearIframeDroppables();

		if (!page) {
		
			_AppBuilder.zoomOut();

		} else {

			var iframe = $('.page-tn').find('#preview_' + page.id);

			iframe.load(function() {
				_AppBuilder.zoomIn(page)
			});
			iframe.attr('src', iframe.attr('src'));
		}

	},
	activateDocShadows: function() {
		var iframe = $('.page-tn').find('#preview_' + currentPage.id);
		var doc = iframe.contents();
		doc.find('body').addClass('active-shadows');
	},
	zoomIn: function(page) {
		currentPage = page;
		$('.page-tn').not('#page-tn-' + page.id).hide();
		$('.page-tn').off('click');
		$('.page-preview').off('click');
		
		//$('.page-tn').find('#preview_' + page.id).contents().off('click');
		
		var pagePreview = $('#page-tn-' + page.id);
		var iframe = $('.page-tn').find('#preview_' + page.id);
		var doc = iframe.contents();
		
		doc.off('click');
		_AppBuilder.activateDocShadows();
		
		doc.on('mouseenter', function() {
			doc.find('body').addClass('active-shadows');
		});
		
		doc.on('mouseleave', function() {
			doc.find('body').removeClass('active-shadows');
		});


		pagePreview.addClass('zoomed').off('click');
		
		var zoomOutButton = $('#zoom-out');
		if (!zoomOutButton.size()) {
			pagePreview.append('<button title="Close Preview" id="zoom-out" class="remove">×</button><div id="status-info"></div>');
			$('#zoom-out', pagePreview).on('click', function() {
				_AppBuilder.zoomOut();
				return false;
			});
		}
		
		var windowWidth = win.width(), windowHeight = win.height();
		var offsetWidth = 160, headerOffsetHeight = 124;
		
		$('#preview_' + page.id).css({
			width: ((windowWidth-offsetWidth)*.6) + px(pagesArea, 2),
			height: windowHeight-headerOffsetHeight + px(pagesArea, 2)
		});
		
	},
	activateAreas: function(page) {
		$('#preview_' + page.id).load(function() {
			var iframe = $(this);
			var doc = $(this).contents();
			var head = doc.find('head');
			if (head) {
				head.append('<style media="screen" type="text/css">'
						+ '* { z-index: 0}\n'
						+ 'body.active-shadows [data-structr-area] { position: relative; -moz-box-shadow: 0 0 .1em #ccc; -webkit-box-shadow: 0 0 .1em #ccc; box-shadow: 0 0 .1em #ccc; }\n'
						+ 'body.active-shadows [data-structr-area] > * { -moz-box-shadow: 0 0 .1em #ccc; -webkit-box-shadow: 0 0 .1em #ccc; box-shadow: 0 0 .1em #ccc; }\n'
						+ 'body.active-shadows [data-structr-area]:hover { opacity: .8; -moz-box-shadow: 0 0 .1em #000; -webkit-box-shadow: 0 0 .1em #000; box-shadow: 0 0 .1em #000; }\n'
						+ 'body.active-shadows [data-structr-area].widget-hover { opacity: .8 }\n'
						//+ '[data-structr-area]:hover { background-color: #ffe; border: 1px solid orange ! important; color: #333; }\n'
						/**
						 * Fix for bug in Chrome preventing the modal dialog background
						 * from being displayed if a page is shown in the preview which has the
						 * transform3d rule activated.
						 */
						+ '.navbar-fixed-top { -webkit-transform: none ! important; }\n'
						+ 'body.active-shadows .remove-button { z-index: 99; position: absolute; color: #555; background: #ccc; line-height: 1.85em; width: 2em; border-radius: .2em; border: 1px solid #aaa; padding: 0; margin: 0; text-align: center; text-shadow: 0 1px 0 #fff; }\n'
						+ '</style>');
			}
			var body = doc.find('body');
			doc.find('*').each(function(i, element) {

				$(element).children('[data-structr-area]').each(function(i, el) {
					var area = $(el);
					
					var children = area.children();
					
					if (children.size() === 0) {
						area.css({ minHeight: 100 });
					} else {
						children.each(function(i, child) {
							var c = $(child);
														
							c.on('mouseenter', function() {
								block++;
								body.find('.remove-button').remove();
								
								var btn = $('.remove-button', area);
								if (btn.size() === 0) {
									area.append('<button class="remove-button">×</button>');
									btn = $('.remove-button', area);
								}

								btn.css({
									left: c.position().left + c.outerWidth() - btn.outerWidth(),
									top: c.position().top
								})
								.on('mouseenter', function(e) {
									block++;
								})
								.on('mouseleave', function(e) {
									block--;
									window.setTimeout(function() {
										if (!block) {
											area.find('.remove-button').remove();
										}
									},10);
								})
								.on('click', function(e) {
									e.stopPropagation();
									var id = c.attr('data-structr-id');
									var parentId = area.attr('data-structr-id');
									
									Command.removeSourceFromTarget(id, parentId, function(obj, size, command) {
										if (command === 'REMOVE_CHILD') {
											 console.log(obj, size, command)
											_AppBuilder.refresh(currentPage);
											//_AppBuilder.loadWidgets();
										}
									});
									return false;
								});
							}).on('mouseleave', function() {
								block = 0;
								window.setTimeout(function() {
									if (!block) {
										area.find('.remove-button').remove();
									}
								},1);
							});
						});
					};
					
					
					
					area.on({
						mouseover: function(e) {
							e.stopPropagation();
							var self = $(this);
							self.addClass('structr-editable-area');
							//statusArea.html(el.attr('data-structr-area'));
						},
						mouseout: function(e) {
							//e.stopPropagation();
							var self = $(this);
							self.removeClass('structr-editable-area');
							//statusArea.html('');
							
						}

					});
					
					area.droppable({
						iframeFix: true,
						iframe: iframe,
						accept: '.widget-preview',
						greedy: true,
						hoverClass: 'widget-hover',
						
						drop: function(e, ui) {
							e.preventDefault();
							e.stopPropagation();
							
							var sourceId = $(ui.draggable).attr('id').substr('widget-preview-'.length);
							var targetId = $(this).attr('data-structr-id');
							
							console.log(sourceId, targetId);
							
							var source = StructrModel.obj(sourceId);
							var target = StructrModel.obj(targetId);
							
							console.log(source, target);
							
							if (!target && source) {
								Command.get(targetId, function(target) {
									_Dragndrop.widgetDropped(source, target, page.id, function() {
										_AppBuilder.refresh(currentPage);
										//_AppBuilder.loadWidgets();
									});
								});
							} else if (source && target) {
								
								// objects are already stored in model
								_Dragndrop.widgetDropped(source, target, page.id, function() {
									_AppBuilder.refresh(currentPage);
									//_AppBuilder.loadWidgets();
								});
								
							} else {

								// try to get objects from server
								Command.get(sourceId, function(source) {
									Command.get(targetId, function(target) {
										_Dragndrop.widgetDropped(source, target, page.id, function() {
											_AppBuilder.refresh(currentPage);
											//_AppBuilder.loadWidgets();
										});
									});
								});
							}
							
						}
					})

				});

			});
		});
	},
	zoomOut: function() {
		fastRemoveAllChildren(widgetsArea[0]);
		_Pages.clearIframeDroppables();
		
		$('#zoom-out').remove();
		currentPage = undefined;
		pagesArea.empty();
		
		var x=0, y=0, c=3;
		Command.list('Page', false, 12, 1, 'position', 'asc', null, function(pages) {
			pages.forEach(function(page) {
				if (x>c) { x = 0; y++ };
				pagesArea.append('<div id="page-tn-' + page.id + '" class="page-tn"><div class="page-preview">'
					+ '<iframe class="preview" id="preview_' + page.id + '" src="/structr/html/' + page.name + '?edit=4"></iframe>'
					+ '</div><div class="page-name">' + page.name + '</div>'
					+ '<div class="icon clone-page" title="Clone Page"><img src="' + _Pages.clone_icon + '"/></div>'
					+ '<div class="icon delete-page" title="Delete Page"><img src="' + _Pages.delete_icon + '"/></div>'
					+ '</div>');

				var tn = $('#page-tn-' + page.id);
				tn.find('.clone-page').on('click', function() {
					Command.clonePage(page.id, function() {
						_AppBuilder.refresh();
					});
				});
				
				tn.find('.delete-page').on('click', function() {
					Command.deleteNode(page.id, true, function() {
						_AppBuilder.refresh();
					});
				});

				tn.css({ left: x*300, top: y*300});
				x++;

				 _AppBuilder.activateAreas(page);

				$('.page-tn').not('.zoomed').find('#preview_' + page.id).load(function() {
					var doc = $(this).contents();
					doc.off('click');
					doc.on('click', function() {
						_AppBuilder.zoomIn(page);
						_AppBuilder.loadWidgets();
					});
					return false;
				});

			});
			if (x>c) { x = 0; y++ };
			pagesArea.append('<div id="add-page-area" class="page-tn"><i class="fa fa-plus"></i></div>');
			$('#add-page-area').css({ left: x*300, top: y*300}).on('click', function() {
				Command.create({type: 'Page'}, function(obj) {
					_AppBuilder.refresh();
				});
			});
		});
	},
	loadWidgets: function() {
		
		fastRemoveAllChildren(widgetsArea[0]);
		widgetsArea.append('<div class="widget-tabs"><ul></ul></div>');
		var w;
		Command.list('Widget', true, 1000, 1, 'name', 'asc', 'id,name,type,source,treePath,isWidget,previewWidth,previewHeight', function(widgets) {
			w = widgets;
			_Widgets.getRemoteWidgets(widgetsUrl, function(widget) {
				w.push(widget);
			}, function() {
				_AppBuilder.appendWidgets(w);
			});
		});

	},
	appendWidgets: function(widgets) {
		
		var tabs = $('.widget-tabs');
		var ul = tabs.children('ul').first();

		widgetGroups = {};

		widgets.forEach(function (widget) {
			
			if (widget.treePath) {
				
				var cleanedPath = clean(widget.treePath);

				if (widgetGroups[cleanedPath]) {
					widgetGroups[cleanedPath].push(widget);
					return;
				} else {
					widgetGroups[cleanedPath] = [widget];
				}
				
			}
		});
		
		Object.keys(widgetGroups).forEach(function(key) {

			ul.append('<li><a href="#widget-tab-area-' + key + '">' + key + '</a></li>');
			tabs.append('<div id="widget-tab-area-' + key + '"></div>');
			var tabArea = $('#widget-tab-area-' + key);

			widgetGroups[key].forEach(function(widget) {
				StructrModel.create(widget, null, false);
				_AppBuilder.appendWidget(widget, tabArea);
			});
		});

		console.log(widgetGroups);

		$('.widget-tabs').tabs({
			activate: function(e, ui) {
				//console.log(ui.newTab.text());
				var tabName = clean(ui.newTab.text());
				_AppBuilder.activateWidgets(widgetGroups[tabName]);
				LSWrapper.setItem(appBuilderActiveWidgetTabRightKey, tabName);
			}
		});

		var tabName = LSWrapper.getItem(appBuilderActiveWidgetTabRightKey);
		if (tabName) {
			$('a[href="#widget-tab-area-' + tabName + '"]').click();
		}
		
	},
	activateWidgets: function(widgets) {
		widgets.forEach(function(widget) {
			var previewBox = $('#widget-preview-' + widget.id);
			var iframe = $('iframe', previewBox);
			// Trigger reload
			iframe.attr('src', '/structr/blank.html');
		});
	},
	appendWidget: function(widget, el) {

		el.append('<div class="widget-tn"><div id="widget-preview-' + widget.id + '" class="widget-preview"><iframe></iframe><div class="widget-name">' + widget.name + '</div></div>');
		var previewBox = $('#widget-preview-' + widget.id);

		previewBox.draggable({
			//helper: 'clone',
			revert: true,
			revertDuration: 0,
			zIndex: 10001,
			appendTo: 'body',
//			cursorAt: {
//				left: 120,
//				top: 60
//			},
			containment: 'body',
			start: function(e, ui) {
				$(ui.helper).css({
					'z-index': 10000
				});
				_AppBuilder.activateDocShadows();
			}
		});

		$('iframe', previewBox).load(function() {
			var iframe = $(this);
			var css = {
				display: 'none'
			};

			iframe.css(css);
			var doc = $(this).contents();

			css = {
				width: '100%',
				height: '100%',
				overflow: 'hidden',
				padding: 0,
				margin: 0
			};

			doc.find('body').css(css);

			if (currentPage) {
				var linkElements = $('#preview_' + currentPage.id).contents().find('head').find('link[rel="stylesheet"]');
				linkElements.each(function(i, link) {
					doc.find('head').append($(link).clone());
				});
				var scriptElements = $('#preview_' + currentPage.id).contents().find('script');
				scriptElements.each(function(i, script) {
					doc.find('head').append($(script).clone());
				});
			}

			doc.find('body').append(widget.source);

			window.setTimeout(function() {
				var firstEl = doc.find('body').children().first();

				//console.log(firstEl.css('height'), firstEl.css('paddingTop'), firstEl.css('paddingBottom'), firstEl.css('marginTop'), firstEl.css('marginBottom'), firstEl.innerHeight(), firstEl.outerHeight());
				var h = parseInt(firstEl.innerHeight()) + parseInt(firstEl.css('paddingTop')) + parseInt(firstEl.css('paddingBottom')) + parseInt(firstEl.css('marginTop')) + parseInt(firstEl.css('marginBottom'));
				//console.log(h);
				//console.log(firstEl.css('height'), firstEl.width(), firstEl.height(), firstEl.outerWidth(), firstEl.outerHeight(), iframe.width(), iframe.height());

				css = {
					//width: Math.min(widget.previewWidth, firstEl.outerWidth()),
					width: firstEl.outerWidth(),
					//height: Math.min(widget.previewHeight, firstEl.outerHeight()),
					height: firstEl.outerHeight(),
					overflow: 'hidden',
					cursor: 'move',
					display: 'block'
				};

				iframe.css(css);

				previewBox.show();
				
				_AppBuilder.resize();

			}, 500);
		});
	},
	resize: function(offsetLeft, offsetRight) {

		Structr.resize();

		$('body').css({
			position: 'fixed'
		});

		var windowWidth = win.width(), windowHeight = win.height();
		var offsetWidth = 160;
		var headerOffsetHeight = 124, previewOffset = 22;

		$('#app-builder').css({
			width: windowWidth,
			height: windowHeight
		});
		
		$('#pages-area').css({
			width: ((windowWidth-offsetWidth)*.6),
			height: windowHeight-headerOffsetHeight
		});

		if (currentPage) {
			$('#preview_' + currentPage.id).css({
				width: ((windowWidth-offsetWidth)*.6) + px(pagesArea, 2),
				height: windowHeight-headerOffsetHeight + px(pagesArea, 2)
			});
		}

		$('#widgets-area').css({
			width: ((windowWidth-offsetWidth)*.4),
			height: windowHeight-headerOffsetHeight
		});
		
		var tabsHeight = $('#widgets-area .widget-tabs ul').outerHeight();
		
		$('#widgets-area .ui-tabs-panel').css({
			height: windowHeight-headerOffsetHeight-tabsHeight
		});

	},
	onload: function() {

		_AppBuilder.init();

		win.off('resize');
		win.resize(function() {
			_AppBuilder.resize();
		});

		Structr.unblockMenu(500);

	},
};

function px(el, em) {
    var fontSize = parseFloat(el.css("font-size"));
    return em*fontSize;
}

function clean(input) {
	return input.replaceAll('/', '').replaceAll(' ', '');
}