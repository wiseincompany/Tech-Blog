import { Client } from '@notionhq/client'
import { BlogPost, PostPage } from '../@types/schema'
import { NotionToMarkdown } from 'notion-to-md'

export default class NotionService {
  client: Client
  n2m: NotionToMarkdown

  constructor() {
    this.client = new Client({ auth: process.env.NOTION_ACCESS_TOKEN })
    this.n2m = new NotionToMarkdown({ notionClient: this.client })
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    const database = process.env.NOTION_BLOG_DATABASE_ID ?? ''
    // 글 리스트
    const response = await this.client.databases.query({
      database_id: database,
      sorts: [
        {
          property: 'Updated',
          direction: 'descending',
        },
      ],
    })

    return response.results.map((res) => {
      return NotionService.pageToPostTransformer(res)
    })
  }

  async getSingleBlogPost(slug: string): Promise<PostPage> {
    let post, markdown

    const database = process.env.NOTION_BLOG_DATABASE_ID ?? ''
    // 글 리스트
    const response = await this.client.databases.query({
      database_id: database,
      filter: {
        property: 'Slug',
        formula: {
          text: {
            equals: slug,
          },
        },
        // 원하는 옵션 추가 영역
      },
      sorts: [
        {
          property: 'Updated',
          direction: 'descending',
        },
      ],
    })

    if (!response.results[0]) {
      throw 'No results available'
    }

    // 노션에서 가져온 페이지
    const page = response.results[0]

    const mdBlocks = await this.n2m.pageToMarkdown(page.id)
    markdown = this.n2m.toMarkdownString(mdBlocks)
    post = NotionService.pageToPostTransformer(page)
    return {
      post,
      markdown,
    }
  }

  private static pageToPostTransformer(page: any): BlogPost {
    let cover = page.cover
    if (cover !== null) {
      switch (cover.type) {
        case 'file':
          cover = page.cover.file
          break
        case 'external':
          cover = page.cover.external
          break
        default:
          cover = ''
      }
    }
    return {
      id: page.id,
      cover: cover === null ? null : cover?.url,
      title: page.properties.Name.title[0]?.plain_text,
      tags: page.properties.Tags?.multi_select,
      description: page.properties.Description.rich_text[0] === undefined ? ' ' : page.properties.Description.rich_text[0]?.plain_text,
      date: page.properties.Updated?.last_edited_time,
      slug: page.properties.Slug?.formula.string,
    }
  }
}
