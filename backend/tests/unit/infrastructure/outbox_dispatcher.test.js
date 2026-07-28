const OutboxDispatcher = require('../../../src/shared/infrastructure/outbox/OutboxDispatcher');

describe('OutboxDispatcher Edge Cases', () => {
  let mockEventSource;
  let mockPublisher;
  let mockOutboxRepo;
  let config;
  let dispatcher;

  beforeEach(() => {
    mockEventSource = { start: jest.fn(), stop: jest.fn() };
    mockPublisher = { publish: jest.fn() };
    mockOutboxRepo = { ack: jest.fn(), fail: jest.fn() };
    
    config = {
      maxRetries: 3,
      baseBackoffMs: 10,
      maxBackoffMs: 100,
      nodeName: 'test-worker'
    };

    dispatcher = new OutboxDispatcher({
      eventSource: mockEventSource,
      publisher: mockPublisher,
      outboxRepo: mockOutboxRepo,
      config
    });
  });

  it('should process events sequentially and ack on success', async () => {
    const events = [
      { id: 'ev1', eventId: 'e1', payload: {}, retryCount: 0 },
      { id: 'ev2', eventId: 'e2', payload: {}, retryCount: 0 }
    ];

    mockPublisher.publish.mockResolvedValueOnce();
    mockPublisher.publish.mockResolvedValueOnce();

    await dispatcher.handleBatch(events);

    expect(mockPublisher.publish).toHaveBeenCalledTimes(2);
    expect(mockOutboxRepo.ack).toHaveBeenCalledTimes(2);
    expect(mockOutboxRepo.ack).toHaveBeenNthCalledWith(1, 'ev1', 'test-worker');
    expect(mockOutboxRepo.ack).toHaveBeenNthCalledWith(2, 'ev2', 'test-worker');
  });

  it('should isolate failures: Poison Message does not stop the batch', async () => {
    const events = [
      { id: 'ev1', eventId: 'e1', payload: {}, retryCount: 0 },
      { id: 'ev2', eventId: 'poison', payload: {}, retryCount: 0 }, // Poison message
      { id: 'ev3', eventId: 'e3', payload: {}, retryCount: 0 }
    ];

    mockPublisher.publish.mockResolvedValueOnce(); // ev1 succeeds
    mockPublisher.publish.mockRejectedValueOnce(new Error('Poison message format invalid')); // ev2 fails
    mockPublisher.publish.mockResolvedValueOnce(); // ev3 succeeds

    await dispatcher.handleBatch(events);

    expect(mockPublisher.publish).toHaveBeenCalledTimes(3);
    expect(mockOutboxRepo.ack).toHaveBeenCalledTimes(2);
    expect(mockOutboxRepo.fail).toHaveBeenCalledTimes(1);

    expect(mockOutboxRepo.ack).toHaveBeenCalledWith('ev1', 'test-worker');
    expect(mockOutboxRepo.fail).toHaveBeenCalledWith(
      'ev2',
      'Poison message format invalid',
      1, // new retry count
      expect.any(Date), // next retry at
      false // isDeadLetter
    );
    expect(mockOutboxRepo.ack).toHaveBeenCalledWith('ev3', 'test-worker');
  });

  it('should mark as dead letter when maxRetries is exceeded', async () => {
    const events = [
      { id: 'ev1', eventId: 'e1', payload: {}, retryCount: 3 } // At max retries
    ];

    mockPublisher.publish.mockRejectedValueOnce(new Error('Persistent DB Failure'));

    await dispatcher.handleBatch(events);

    expect(mockOutboxRepo.fail).toHaveBeenCalledWith(
      'ev1',
      'Persistent DB Failure',
      4, // new retry count (3+1)
      expect.any(Date),
      true // isDeadLetter = true because 4 > 3
    );
  });

  it('should calculate exponential backoff correctly', async () => {
    const events = [
      { id: 'ev1', eventId: 'e1', payload: {}, retryCount: 1 }
    ];

    mockPublisher.publish.mockRejectedValueOnce(new Error('Fail'));

    const startTime = Date.now();
    await dispatcher.handleBatch(events);

    // baseBackoff = 10, retryCount = 1 -> delay = 10 * 2^1 = 20ms
    expect(mockOutboxRepo.fail).toHaveBeenCalled();
    const callArgs = mockOutboxRepo.fail.mock.calls[0];
    const nextRetryAt = callArgs[3];
    
    const delay = nextRetryAt.getTime() - startTime;
    // Delay should be roughly 20ms
    expect(delay).toBeGreaterThanOrEqual(19);
    expect(delay).toBeLessThan(50);
  });
});
