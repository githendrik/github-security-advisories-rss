import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Feed } from 'feed'

const createFeed = async () => {

    const feed = new Feed({
        title: 'Feed Title',
        description: 'This is my personal feed!',
        id: 'https://example.com/',
        link: 'https://example.com/',
        language: 'en',
        feedLinks: {
            json: 'https://example.com/json',
            atom: 'https://example.com/atom'
        },
        author: {
            name: 'John Doe',
            email: 'johndoe@example.com',
            link: 'https://example.com/johndoe'
        }
    });


    const response = await fetch('https://github.com/datahub-project/datahub/security');
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
    const slug = request.query;

    console.log(slug);

    const f = await createFeed(slug);
    response.setHeader("content-type", "text/xml")
    return response.send(f.rss2());
}
