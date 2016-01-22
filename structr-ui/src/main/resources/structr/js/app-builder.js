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
var pageArea, paWidth, paHeight, currentPage;

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

		main.append('<div id="app-builder"><div id="page-area"></div><div id="widget-area"></div></div>');
		pageArea = $('#page-area');

		_AppBuilder.zoomOut();

	},
	zoomIn: function(page) {
		currentPage = page;
		pageArea.empty();
		pageArea.append('<iframe class="preview" id="preview_' + page.id + '" src="/structr/html/' + page.name + '?edit=4"></iframe>');
		$('#preview_' + page.id).css({
			'margin-top': '-1em',
			'margin-left': '-1em',
			'width': '+=' + px(pageArea, 2),
			'height': '+=' + px(pageArea, 2)
		});
		$('#preview_' + page.id).load(function() {
			var doc = $(this).contents();
			doc.on('click', function() {
				_AppBuilder.zoomOut(page);
			});
			doc.find('*').each(function(i, element) {

				var head = doc.find('head');
				if (head) {
					head.append('<style media="screen" type="text/css">'
							+ '* { z-index: 0}\n'
							+ '[data-structr-area] { -moz-box-shadow: 0 0 5px #888; -webkit-box-shadow: 0 0 5px #888; box-shadow: 0 0 5px #888; }\n'
						    //+ '[data-structr-area] { background-color: #ffe; -moz-box-shadow: 0 0 5px #888; -webkit-box-shadow: 0 0 5px yellow; box-shadow: 0 0 5px #888; }\n'
							//+ '[data-structr-area]:hover { background-color: #ffe; border: 1px solid orange ! important; color: #333; }\n'
							/**
							 * Fix for bug in Chrome preventing the modal dialog background
							 * from being displayed if a page is shown in the preview which has the
							 * transform3d rule activated.
							 */
							+ '.navbar-fixed-top { -webkit-transform: none ! important; }'
							+ '</style>');
				}
				getComments(element).forEach(function(c) {

					var inner = $(getNonCommentSiblings(c.node));
					$(c.node).replaceWith('<div data-structr-id="' + c.id + '" data-structr-raw-content="' + escapeForHtmlAttributes(c.rawContent, false) + '"></div>');
					var el = $(element).children('[data-structr-id="' + c.id + '"]');
					el.append(inner);

					$(el).on({
						mouseover: function(e) {
							e.stopPropagation();
							var self = $(this);
							self.addClass('structr-editable-area');
							_Pages.highlight(self.attr('data-structr-id'));
						},
						mouseout: function(e) {
							e.stopPropagation();
							var self = $(this);
							self.removeClass('structr-editable-area');
							_Pages.unhighlight(self.attr('data-structr-id'));
						},
						click: function(e) {
							e.stopPropagation();
							e.preventDefault();
							var self = $(this);

							if (contentSourceId) {
								// click on same element again?
								if (self.attr('data-structr-id') === contentSourceId) {
									return;
								}
							}
							contentSourceId = self.attr('data-structr-id');

							if (self.hasClass('structr-editable-area-active')) {
								return false;
							}
							self.removeClass('structr-editable-area').addClass('structr-editable-area-active').prop('contenteditable', true).focus();

							// Store old text in global var and attribute
							textBeforeEditing = self.text();

							var srcText = expandNewline(self.attr('data-structr-raw-content'));

							// Replace only if it differs (e.g. for variables)
							if (srcText !== textBeforeEditing) {
								self.html(srcText);
								textBeforeEditing = srcText;
							}
							_Pages.expandTreeNode(contentSourceId);
							return false;
						},
						blur: function(e) {
							e.stopPropagation();
							_Pages.saveInlineElement(this);
						}
					});

				});

			});
		});
		
	},
	zoomOut: function() {
		currentPage = undefined;
		pageArea.empty();
		Command.list('Page', false, 12, 1, 'position', 'asc', null, function(pages) {
			
			pages.forEach(function(page) {
				pageArea.append('<div id="page-tn-' + page.id + '" class="page-tn"><div class="page-preview"><iframe class="preview" id="preview_' + page.id + '" src="/structr/html/' + page.name + '"></iframe></div><div class="page-name">' + page.name + '</div></div>');
				
				$('#preview_' + page.id).load(function() {
					var doc = $(this).contents();
					doc.on('click', function() {
						_AppBuilder.zoomIn(page);
					});
				});
				
				$('#page-tn-' + page.id).on('click', function() {
					_AppBuilder.zoomIn(page);
				});
				
			});
		});
	},
	resize: function(offsetLeft, offsetRight) {

		Structr.resize();

		$('body').css({
			position: 'fixed'
		});

		var windowWidth = win.width(), windowHeight = win.height();
		var offsetWidth = 160;
		var headerOffsetHeight = 112, previewOffset = 22;

		$('#app-builder').css({
			width: windowWidth,
			height: windowHeight
		});
		
		$('#page-area').css({
			width: ((windowWidth-offsetWidth)*.6),
			height: windowHeight-headerOffsetHeight
		});

		if (currentPage) {
			$('#preview_' + currentPage.id).css({
				width: ((windowWidth-offsetWidth)*.6) + px(pageArea, 2),
				height: windowHeight-headerOffsetHeight + px(pageArea, 2)
			});
		}

		$('#widget-area').css({
			width: ((windowWidth-offsetWidth)*.4),
			height: windowHeight-headerOffsetHeight
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