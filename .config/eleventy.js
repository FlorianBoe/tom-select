import { IdAttributePlugin } from "@11ty/eleventy";
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import markdownIt from 'markdown-it';
import csp_plugin from './eleventy.csp.cjs';

export default function(eleventyConfig) {
	// Aliases are in relation to the _includes folder
	eleventyConfig.addLayoutAlias('about', 'layouts/about.html');
	eleventyConfig.addPassthroughCopy({'doc_src/css':'css'});
	eleventyConfig.addPassthroughCopy({'doc_src/js':'js'});
	eleventyConfig.addPassthroughCopy({'dist/js':'js'});
	eleventyConfig.addPassthroughCopy({'dist/css':'css'});
	eleventyConfig.addPassthroughCopy({'dist/esm':'esm'});

	// content security policy
	eleventyConfig.addPlugin(csp_plugin,{
		csp:{
			'default-src':		["'self'"],
			'img-src':			['https://*','data:'],
			'style-src':		["'self'",'unpkg.com','cdnjs.cloudflare.com','cdn.jsdelivr.net'],
			'script-src':		["'self'","'unsafe-eval'",'mc.yandex.ru','cdn.jsdelivr.net'], // unsafe-eval for docsearch
			'font-src':			["'self'",'cdnjs.cloudflare.com'],
			'connect-src':		['api.github.com','whatcms.org','api.reddit.com','mc.yandex.ru','https://*.algolia.net','https://*.algolianet.com'],
		}
	});
	
	// header anchors
	eleventyConfig.addPlugin(IdAttributePlugin);

	// syntax highlighting
	eleventyConfig.addPlugin(syntaxHighlight);

	function GlobCollection(name, glob){
		eleventyConfig.addCollection(name, function(collection) {
			return collection.getFilteredByGlob(glob)
				.filter(function(page){
					return !page.data.exclude;
				})
				.sort(function(a, b) {
					let nameA = a.data.title.toUpperCase();
					let nameB = b.data.title.toUpperCase();
					if (nameA < nameB) return -1;
					else if (nameA > nameB) return 1;
					else return 0;
			});
		});
	}

	GlobCollection('plugins','doc_src/pages/plugins/*.njk')
	GlobCollection('demosAlpha','doc_src/pages/examples/*.njk')

	// link shortcode
	eleventyConfig.addNunjucksShortcode('nav_link', function(item) {
		var title = '';
		if( item.title ){
			title = item.title;
		}else if( item.data.nav_title ){
			title = item.data.nav_title;
		}else{
			title = item.data.title;
		}

		if( this.page.url == item.url || this.page.filePathStem == item.filePathStem  ){
			return `<span class="nav-link active">${title}</span>`;
		}

		return `<a class="nav-link" href="${item.url}">${title}</a>`;
	});



	const md = markdownIt({
		html: true,
		breaks: false,
		//linkify: true
	});
	let orig_normalizeLink = md.normalizeLink;
	md.normalizeLink = function(url){

		// change "usage.md" to "usage"
		if( url.substr(-3) === '.md' ){
			url = url.substr(0,url.length - 3);
		}

		// change "usage" to "../usage"
		if( url.indexOf(':') == -1 && url.indexOf('/') != 0 && url.indexOf('#') == -1 ){
			url = '../'+url;
		}

		return orig_normalizeLink.call(this,url);
	}

	eleventyConfig.setLibrary('md', md );

	return {
		dir: {
			data: '../data',		// relative to input path
			input: 'doc_src/pages', // relative to project root
			output: 'build-docs',	// relative to project root
			includes: '../includes', // relative to input path
		}
	};
}
