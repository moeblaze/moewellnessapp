
Moe Community Wellness — Add-on Pack v12
========================================

This pack adds:
- /tags/index.html  (dynamic tag list from data/products.json)
- /tags/view.html   (dynamic tag view: /tags/view.html?tag=skin)
- /explore/index.html (search & filters: category, wavelengths, tags, min irradiance, sort)

How to install into your existing site (v11 or later):
1) Unzip this pack into the root of your site so that these paths exist:
   - /tags/index.html
   - /tags/view.html
   - /explore/index.html
2) Make sure your site already has: /data/products.json and /styles.css
3) Add "Explore" and "Tags" to your nav if you don't see them yet:
   <a href="explore/index.html">Explore</a>
   <a href="tags/index.html">Tags</a>

Optional (sitemap):
- Add these URLs to your sitemap.xml:
  https://www.moecommunitycloud.com/tags
  https://www.moecommunitycloud.com/tags/view
  https://www.moecommunitycloud.com/explore
