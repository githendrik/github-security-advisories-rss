import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Feed } from 'feed'

const createFeed = async (slug) => {

    const feed = new Feed({
        title: `Security Advisories for ${slug}`,
        description: `Security Advisories for ${slug}`,
        id: 'https://example.com/',
        link: 'https://example.com/',
        language: 'en',
    });

    const response = await fetch(`https://github.com/${slug}/security`);
    // const response = await fetch('https://artifactory.swisscom.com/artifactory/github-generic-remote/datahub-project/datahub/security');
    const body = await response.text();

    const { document } = (new JSDOM(body)).window;

    const items = document.querySelectorAll('#repo-content-turbo-frame ul li')

    items.forEach(item => {
        const link = item.querySelector('a');
        const date = new Date(item.querySelector('relative-time').getAttribute('datetime'));

        const name = link.innerHTML.trim();
        const url = link.href;
        const author = item.querySelector('.author').innerHTML;

        const fullText = item.textContent.replace(/ +(?= )/g,'').replace(/\n\s*\n/g, '\n');

        feed.addItem({
            title: name,
            id: url,
            link: url,
            description: fullText,
            content: fullText,
            author: [
                {
                    name: author,
                }
            ],
            date,
        });

    })

    return feed;
};

export default async function handler(request, response) {
    const slug = request.query.slug;

    if (!slug) {
        return response.send('Please provide your project slug as query param: ?slug=project/repo')
    }

    const f = await createFeed(slug);
    response.setHeader("content-type", "text/xml")
    return response.send(f.rss2());
}
