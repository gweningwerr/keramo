<?php
namespace AppBundle\Controller;
/**
 * class: ExtendedController
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 * @package AppBundle\ExtendedController
 */
use AppBundle\Helper\RequestHelper;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class ExtendedController extends Controller
{
	/**
	 * Отдача контента, вариант временный, требует доработки скорее всего
	 * @param null $val
	 *
	 * @return null|JsonResponse
	 */
	protected function ok($val = null)
	{
		if (RequestHelper::isAjax()) {
			$res['content'] = $val;
			$res['status'] = 'success';
			$res =  new JsonResponse($res);
		} else {
			$res = $val;
		}
		return $res;
	}

	/**
	 * Отдача контента ОШИБКИ, вариант временный, требует доработки скорее всего
	 * @param null $val
	 *
	 * @return null|JsonResponse
	 */
	protected function error($val=null)
	{
		if (RequestHelper::isAjax()) {
			$res['content'] = $val;
			$res['status'] = 'error';
			$res =  new JsonResponse($res);
		} else {
			$res = $val;
		}
		return $res;
	}
}
