import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { UserDto } from '../auth/dto/user.dto';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let service: {
    create: jest.Mock;
    findAllForOwner: jest.Mock;
    findOneForOwner: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    addQuestion: jest.Mock;
    updateQuestion: jest.Mock;
    removeQuestion: jest.Mock;
    publish: jest.Mock;
  };

  const user: UserDto = { id: 'user-1', email: 'maya@example.com' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue('created'),
      findAllForOwner: jest.fn().mockResolvedValue([]),
      findOneForOwner: jest.fn().mockResolvedValue('one'),
      update: jest.fn().mockResolvedValue('updated'),
      remove: jest.fn().mockResolvedValue(undefined),
      addQuestion: jest.fn().mockResolvedValue('with-question'),
      updateQuestion: jest.fn().mockResolvedValue('patched-question'),
      removeQuestion: jest.fn().mockResolvedValue('without-question'),
      publish: jest.fn().mockResolvedValue({ id: 'q', permalink: 'abc123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [{ provide: QuizzesService, useValue: service }],
    }).compile();

    controller = module.get(QuizzesController);
  });

  it('delegates create with the current user id', async () => {
    const dto = { title: 't', questions: [] } as never;
    await controller.create(user, dto);
    expect(service.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates findAll with the current user id', async () => {
    await controller.findAll(user);
    expect(service.findAllForOwner).toHaveBeenCalledWith('user-1');
  });

  it('delegates findOne with the id and current user id', async () => {
    await controller.findOne(user, 'quiz-9');
    expect(service.findOneForOwner).toHaveBeenCalledWith('quiz-9', 'user-1');
  });

  it('delegates update with the id, user id and body', async () => {
    const dto = { title: 't', questions: [] } as never;
    await controller.update(user, 'quiz-9', dto);
    expect(service.update).toHaveBeenCalledWith('quiz-9', 'user-1', dto);
  });

  it('delegates remove with the id and current user id', async () => {
    await controller.remove(user, 'quiz-9');
    expect(service.remove).toHaveBeenCalledWith('quiz-9', 'user-1');
  });

  it('delegates addQuestion with the id, user id and body', async () => {
    const dto = { text: 'q', type: 'SINGLE', answers: [] } as never;
    await controller.addQuestion(user, 'quiz-9', dto);
    expect(service.addQuestion).toHaveBeenCalledWith('quiz-9', 'user-1', dto);
  });

  it('delegates updateQuestion with the id, user id, question id and body', async () => {
    const dto = { text: 'new' } as never;
    await controller.updateQuestion(user, 'quiz-9', 'ques-3', dto);
    expect(service.updateQuestion).toHaveBeenCalledWith(
      'quiz-9',
      'user-1',
      'ques-3',
      dto,
    );
  });

  it('delegates removeQuestion with the id, user id and question id', async () => {
    await controller.removeQuestion(user, 'quiz-9', 'ques-3');
    expect(service.removeQuestion).toHaveBeenCalledWith(
      'quiz-9',
      'user-1',
      'ques-3',
    );
  });

  it('delegates publish with the id and current user id', async () => {
    await controller.publish(user, 'quiz-9');
    expect(service.publish).toHaveBeenCalledWith('quiz-9', 'user-1');
  });
});
