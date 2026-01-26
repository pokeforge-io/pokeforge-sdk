namespace PokeForge.SDK.Tests.Pagination;

using FluentAssertions;
using Xunit;
using PokeForge.SDK.Client.Pagination;

public class PageTests
{
    [Fact]
    public void Data_Should_Return_Items()
    {
        var data = new List<string> { "a", "b", "c" };
        var pageInfo = new PageInfo { Page = 1, PageSize = 10, TotalCount = 3, TotalPages = 1, HasNext = false, HasPrevious = false };
        var page = new Page<string>(data, pageInfo, (_, _, _) => Task.FromResult<Page<string>>(null!));

        page.Data.Should().BeEquivalentTo(data);
    }

    [Fact]
    public void Pagination_Should_Return_Metadata()
    {
        var pageInfo = new PageInfo { Page = 2, PageSize = 10, TotalCount = 25, TotalPages = 3, HasNext = true, HasPrevious = true };
        var page = new Page<string>(new List<string>(), pageInfo, (_, _, _) => Task.FromResult<Page<string>>(null!));

        page.Pagination.Page.Should().Be(2);
        page.Pagination.PageSize.Should().Be(10);
        page.Pagination.TotalCount.Should().Be(25);
        page.Pagination.TotalPages.Should().Be(3);
        page.Pagination.HasNext.Should().BeTrue();
        page.Pagination.HasPrevious.Should().BeTrue();
    }

    [Fact]
    public async Task NextPageAsync_Should_Return_Null_When_No_Next_Page()
    {
        var pageInfo = new PageInfo { Page = 1, PageSize = 10, TotalCount = 5, TotalPages = 1, HasNext = false, HasPrevious = false };
        var page = new Page<string>(new List<string>(), pageInfo, (_, _, _) => Task.FromResult<Page<string>>(null!));

        var nextPage = await page.NextPageAsync();

        nextPage.Should().BeNull();
    }

    [Fact]
    public async Task NextPageAsync_Should_Fetch_Next_Page()
    {
        var fetchCalled = false;
        var page1Info = new PageInfo { Page = 1, PageSize = 10, TotalCount = 20, TotalPages = 2, HasNext = true, HasPrevious = false };
        var page2Info = new PageInfo { Page = 2, PageSize = 10, TotalCount = 20, TotalPages = 2, HasNext = false, HasPrevious = true };

        var page1 = new Page<string>(
            new List<string> { "a" },
            page1Info,
            (page, pageSize, ct) =>
            {
                fetchCalled = true;
                page.Should().Be(2);
                pageSize.Should().Be(10);
                return Task.FromResult(new Page<string>(new List<string> { "b" }, page2Info, (_, _, _) => Task.FromResult<Page<string>>(null!)));
            });

        var nextPage = await page1.NextPageAsync();

        fetchCalled.Should().BeTrue();
        nextPage.Should().NotBeNull();
        nextPage!.Data.Should().Contain("b");
    }

    [Fact]
    public async Task PreviousPageAsync_Should_Return_Null_When_No_Previous_Page()
    {
        var pageInfo = new PageInfo { Page = 1, PageSize = 10, TotalCount = 5, TotalPages = 1, HasNext = false, HasPrevious = false };
        var page = new Page<string>(new List<string>(), pageInfo, (_, _, _) => Task.FromResult<Page<string>>(null!));

        var prevPage = await page.PreviousPageAsync();

        prevPage.Should().BeNull();
    }

    [Fact]
    public async Task GoToPageAsync_Should_Fetch_Specific_Page()
    {
        var fetchedPage = 0;
        var pageInfo = new PageInfo { Page = 1, PageSize = 10, TotalCount = 50, TotalPages = 5, HasNext = true, HasPrevious = false };

        var page = new Page<string>(
            new List<string>(),
            pageInfo,
            (page, pageSize, ct) =>
            {
                fetchedPage = page;
                return Task.FromResult(new Page<string>(new List<string>(), pageInfo with { Page = page }, (_, _, _) => Task.FromResult<Page<string>>(null!)));
            });

        var page3 = await page.GoToPageAsync(3);

        fetchedPage.Should().Be(3);
        page3.Pagination.Page.Should().Be(3);
    }

    [Fact]
    public async Task ToListAsync_Should_Collect_All_Items()
    {
        var page2Info = new PageInfo { Page = 2, PageSize = 2, TotalCount = 4, TotalPages = 2, HasNext = false, HasPrevious = true };
        var page2 = new Page<int>(new List<int> { 3, 4 }, page2Info, (_, _, _) => Task.FromResult<Page<int>>(null!));

        var page1Info = new PageInfo { Page = 1, PageSize = 2, TotalCount = 4, TotalPages = 2, HasNext = true, HasPrevious = false };
        var page1 = new Page<int>(new List<int> { 1, 2 }, page1Info, (_, _, _) => Task.FromResult(page2));

        var allItems = await page1.ToListAsync();

        allItems.Should().BeEquivalentTo(new[] { 1, 2, 3, 4 });
    }

    [Fact]
    public async Task AsyncEnumeration_Should_Iterate_All_Items_Across_Pages()
    {
        var page2Info = new PageInfo { Page = 2, PageSize = 2, TotalCount = 4, TotalPages = 2, HasNext = false, HasPrevious = true };
        var page2 = new Page<int>(new List<int> { 3, 4 }, page2Info, (_, _, _) => Task.FromResult<Page<int>>(null!));

        var page1Info = new PageInfo { Page = 1, PageSize = 2, TotalCount = 4, TotalPages = 2, HasNext = true, HasPrevious = false };
        var page1 = new Page<int>(new List<int> { 1, 2 }, page1Info, (_, _, _) => Task.FromResult(page2));

        var items = new List<int>();
        await foreach (var item in page1)
        {
            items.Add(item);
        }

        items.Should().BeEquivalentTo(new[] { 1, 2, 3, 4 });
    }
}
