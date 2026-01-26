namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing blog posts.
/// </summary>
public sealed class ListBlogPostsOptions : PaginationOptions
{
    /// <summary>
    /// Filter by category.
    /// </summary>
    public string? Category { get; set; }

    internal ListBlogPostsOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize,
        Category = Category
    };
}

/// <summary>
/// Blog API - read blog posts.
/// </summary>
public sealed class BlogResource : BaseResource
{
    internal BlogResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get a paginated list of published blog posts.
    /// Returns only Site/Staff posts that are published and public.
    /// </summary>
    public async Task<Page<BlogPost>> ListAsync(
        ListBlogPostsOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListBlogPostsOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("limit", options.PageSize),
            ("category", options.Category)
        );

        var response = await Http.GetAsync<BlogListResponse>("/Blog", query, cancellationToken)
            .ConfigureAwait(false);

        return CreatePagedResponse(
            response!,
            r => r.Data,
            r => r.Pagination,
            async (page, pageSize, ct) =>
            {
                var newOptions = options.Clone();
                newOptions.Page = page;
                newOptions.PageSize = pageSize;
                return await ListAsync(newOptions, ct).ConfigureAwait(false);
            });
    }

    /// <summary>
    /// Get a single published blog post by ID.
    /// Returns only Site/Staff posts that are published and public.
    /// </summary>
    public async Task<BlogPost> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<BlogSingleResponse>($"/Blog/{id}", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new NotFoundException("Blog post not found");
    }

    /// <summary>
    /// Iterate through all blog posts using IAsyncEnumerable.
    /// </summary>
    public async IAsyncEnumerable<BlogPost> ListAllAsync(
        ListBlogPostsOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListBlogPostsOptions();
        options.Page = 1;

        var page = await ListAsync(options, cancellationToken).ConfigureAwait(false);

        await foreach (var post in page.WithCancellation(cancellationToken))
        {
            yield return post;
        }
    }
}
