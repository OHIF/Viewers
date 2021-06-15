# Add a Logo to the Viewer

The OHIF Framework provides [**ohif-header**](https://github.com/OHIF/Viewers/tree/master/Packages/ohif-header) package to add a header into application layout. **ohif-header** package is designed as a [custom block helper](http://blazejs.org/api/spacebars.html#Custom-Block-Helpers) named **header** to define your own header context.

If you would like to add SVG logo to header please follow these steps.

1. Add your SVG logo into public folder.

2. Add **header** content block which will be located on the top of the application layout into your application's main template. You can also pass some parameters to **header** content block to customize the header.

    * headerClasses: the list of classes which will be applied to header element
    * brandHref: the url of the logo to link

{% raw %}
``` html
{{#header headerClasses="header-big bg-blue" brandHref="your logo link"}}
...
{{/header}}
```
{% endraw %}

3. Create a section called as **brand** in **header** content block and add your logo content which is displayed on the left side of the header as default into section **brand**.

 {% raw %}
 ``` html
    {{#header}}
        {{#section "brand"}}
            <!-- Add logo image -->
            <svg>
                <use xlink:href="/yourLogo.svg"}}></use>
            </svg>

            <!-- Add logo text -->
            <div>Logo Text</div>
        {{/section}}
    {{/header}}
 ```
 {% endraw %}

 For example, see how it works in [OHIF Viewer](https://github.com/OHIF/Viewers/blob/master/OHIFViewer/client/components/ohifViewer/ohifViewer.html#L2)
